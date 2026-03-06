import Anthropic from '@anthropic-ai/sdk'
import { ZodSchema, ZodError } from 'zod'
import {
  ExtractionResultSchema,
  RecipeGenerationResultSchema,
  type ExtractionResult,
  type RecipeGenerationResult,
  type PreferencesInput,
} from './schemas.js'
import { normalizeIngredients } from './normalization.js'
import { getFallbackRecipes } from './fallback.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

async function callClaude<T>(
  system: string,
  user: string,
  schema: ZodSchema<T>,
  imageBase64s?: string[]
): Promise<T> {
  const content: Anthropic.MessageParam['content'] = []

  for (const b64 of imageBase64s ?? []) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: b64 },
    })
  }
  content.push({ type: 'text', text: user })

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content }],
  })

  const raw = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  const json = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  try {
    return schema.parse(JSON.parse(json))
  } catch {
    // Retry with repair prompt
    const repair = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [
        { role: 'user', content: [{ type: 'text', text: user }] },
        { role: 'assistant', content: raw },
        { role: 'user', content: [{ type: 'text', text: 'Your response did not match the required JSON schema. Return ONLY valid JSON, no markdown.' }] },
      ],
    })
    const raw2 = repair.content.filter((b) => b.type === 'text').map((b) => (b as Anthropic.TextBlock).text).join('')
    const json2 = raw2.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    return schema.parse(JSON.parse(json2))
  }
}

export async function extractFromImages(imageBase64s: string[]): Promise<ExtractionResult> {
  const system = `You are a food recognition assistant. Return ONLY valid JSON matching this exact schema:
{"ingredients":[{"name":string,"confidence":number,"notes":string|null}],"warnings":["low_light"|"blurry"|"occluded"]}
Only include visible food items. Use common English names. No markdown, no explanation.`

  const result = await callClaude(
    system,
    'Identify all visible food ingredients in the image(s).',
    ExtractionResultSchema,
    imageBase64s
  )

  return {
    ingredients: normalizeIngredients(result.ingredients),
    warnings: result.warnings ?? [],
  }
}

export async function generateRecipesAI(
  ingredients: string[],
  preferences?: PreferencesInput
): Promise<RecipeGenerationResult> {
  const system = `You are a chef. Generate 3-5 recipes from available ingredients.
CRITICAL: "uses" array MUST ONLY contain items from: ${JSON.stringify(ingredients)}
Items not in that list go in "missing".
Return ONLY valid JSON:
{"recipes":[{"id":string,"title":string,"description":string,"cook_time_minutes":number,"difficulty":"easy"|"medium"|"hard","servings":number,"uses":string[],"missing":string[],"steps":[{"step_number":number,"instruction":string,"timer_seconds":number|null}],"usage_ratio":number}]}`

  const prefLines = [
    `Available: ${ingredients.join(', ')}`,
    preferences?.cook_time_max ? `Max time: ${preferences.cook_time_max} min` : '',
    preferences?.diet_tags?.length ? `Diet: ${preferences.diet_tags.join(', ')}` : '',
    preferences?.allergy_tags?.length ? `Avoid: ${preferences.allergy_tags.join(', ')}` : '',
    preferences?.servings ? `Servings: ${preferences.servings}` : '',
    'Generate 3-5 recipes maximizing ingredient usage.',
  ].filter(Boolean).join('\n')

  try {
    const result = await callClaude(system, prefLines, RecipeGenerationResultSchema)
    const ingredientSet = new Set(ingredients)
    return {
      recipes: result.recipes.map((r) => ({
        ...r,
        uses: r.uses.filter((u) => ingredientSet.has(u)),
        usage_ratio: r.uses.filter((u) => ingredientSet.has(u)).length / Math.max(ingredients.length, 1),
      })),
    }
  } catch {
    // Fallback to seed recipes
    return { recipes: getFallbackRecipes(ingredients, preferences) as any }
  }
}
