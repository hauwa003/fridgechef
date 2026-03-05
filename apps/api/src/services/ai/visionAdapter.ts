import { callAI } from './orchestrator.js'
import { ExtractionResultSchema, type ExtractionResult } from '@fridgechef/shared'

const SYSTEM_PROMPT = `You are a food recognition assistant. Your ONLY job is to identify visible food items from fridge or pantry photos.

Rules:
- Return ONLY a valid JSON object. No markdown, no explanation, no code fences.
- Only include items that are clearly visible as food or ingredients.
- Do not include containers, appliances, or non-food items.
- Use common English names (e.g. "bell pepper" not "capsicum").
- Assign confidence: 0.9+ for clearly visible items, 0.6-0.89 for partially visible, below 0.6 for uncertain.
- Include warnings if image quality is poor.

JSON schema you must follow exactly:
{
  "ingredients": [
    { "name": string, "confidence": number (0-1), "notes": string | null }
  ],
  "warnings": array of "low_light" | "blurry" | "occluded" (can be empty)
}`

const USER_PROMPT = `Identify all visible food ingredients in the provided image(s). Return the JSON response following the schema exactly.`

export async function runVisionExtraction(
  imageUrls: string[]
): Promise<ExtractionResult & { modelVersion: string; latencyMs: number }> {
  const images = imageUrls.map((url) => ({
    url,
    mediaType: 'image/jpeg' as const,
  }))

  const result = await callAI(
    {
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: USER_PROMPT,
      images,
      maxTokens: 1024,
    },
    ExtractionResultSchema
  )

  return {
    ingredients: result.data.ingredients,
    warnings: result.data.warnings ?? [],
    modelVersion: result.modelVersion,
    latencyMs: result.latencyMs,
  }
}
