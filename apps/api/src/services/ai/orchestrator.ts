import Anthropic from '@anthropic-ai/sdk'
import { ZodSchema, ZodError } from 'zod'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-6'

// ─── Circuit Breaker ────────────────────────────────────────────────────────
const FAILURE_THRESHOLD = 5
const RESET_AFTER_MS = 60_000

let consecutiveFailures = 0
let circuitOpenAt: number | null = null

function isCircuitOpen(): boolean {
  if (circuitOpenAt === null) return false
  if (Date.now() - circuitOpenAt > RESET_AFTER_MS) {
    // Half-open: allow one attempt
    circuitOpenAt = null
    consecutiveFailures = 0
    return false
  }
  return true
}

function recordSuccess() {
  consecutiveFailures = 0
  circuitOpenAt = null
}

function recordFailure() {
  consecutiveFailures++
  if (consecutiveFailures >= FAILURE_THRESHOLD) {
    circuitOpenAt = Date.now()
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface AICallOptions {
  systemPrompt: string
  userPrompt: string
  images?: { url: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }[]
  maxTokens?: number
}

export interface AICallResult<T> {
  data: T
  modelVersion: string
  latencyMs: number
  inputTokens: number
  outputTokens: number
}

// ─── Core Call ──────────────────────────────────────────────────────────────
/**
 * Call Claude with strict JSON output enforced via schema validation.
 * Retries once with a repair prompt on schema validation failure.
 */
export async function callAI<T>(
  options: AICallOptions,
  schema: ZodSchema<T>
): Promise<AICallResult<T>> {
  if (isCircuitOpen()) {
    throw Object.assign(new Error('AI service circuit breaker open'), { code: 'CIRCUIT_OPEN' })
  }

  const start = Date.now()

  try {
    const result = await attemptCall(options, schema, false)
    recordSuccess()
    return { ...result, latencyMs: Date.now() - start }
  } catch (err) {
    if (err instanceof ZodError) {
      // Retry once with repair prompt
      try {
        const result = await attemptCall(options, schema, true)
        recordSuccess()
        return { ...result, latencyMs: Date.now() - start }
      } catch (retryErr) {
        recordFailure()
        throw Object.assign(new Error('AI returned invalid schema after retry'), {
          code: 'SCHEMA_VALIDATION_FAILED',
          cause: retryErr,
        })
      }
    }

    recordFailure()
    throw err
  }
}

async function attemptCall<T>(
  options: AICallOptions,
  schema: ZodSchema<T>,
  isRepair: boolean
): Promise<Omit<AICallResult<T>, 'latencyMs'>> {
  const content: Anthropic.MessageParam['content'] = []

  // Attach images if provided (vision calls)
  if (options.images?.length) {
    for (const img of options.images) {
      // Fetch image and convert to base64 for Claude
      const response = await fetch(img.url)
      if (!response.ok) throw new Error(`Failed to fetch image: ${img.url}`)
      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')

      content.push({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: base64 },
      })
    }
  }

  const userText = isRepair
    ? `${options.userPrompt}\n\nIMPORTANT: Your previous response did not match the required JSON schema. Return ONLY valid JSON matching the schema exactly. No markdown, no explanation.`
    : options.userPrompt

  content.push({ type: 'text', text: userText })

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: options.maxTokens ?? 2048,
    system: options.systemPrompt,
    messages: [{ role: 'user', content }],
  })

  const rawText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  // Strip markdown code fences if present
  const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new ZodError([{ code: 'custom', message: 'Response was not valid JSON', path: [] }])
  }

  const validated = schema.parse(parsed)

  return {
    data: validated,
    modelVersion: message.model,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  }
}
