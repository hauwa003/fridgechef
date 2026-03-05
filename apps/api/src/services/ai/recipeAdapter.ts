import { callAI } from './orchestrator.js'
import { RecipeGenerationResultSchema, type RecipeGenerationResult } from '@fridgechef/shared'
import type { PreferencesInput } from '@fridgechef/shared'

function buildSystemPrompt(ingredients: string[]): string {
  return `You are a professional chef and recipe generator. Generate practical, delicious recipes based on available ingredients.

CRITICAL CONSTRAINTS — violating these will cause your response to be rejected:
1. The "uses" array MUST ONLY contain items from this exact list: ${JSON.stringify(ingredients)}
2. Any ingredient NOT in that list goes in "missing" (optional extras the recipe could use)
3. Return BETWEEN 3 AND 5 recipes — no more, no less
4. Return ONLY valid JSON — no markdown, no explanation, no code fences
5. Every "id" must be a unique string (use slugs like "pasta-primavera")

JSON schema to follow exactly:
{
  "recipes": [
    {
      "id": string (unique slug),
      "title": string,
      "description": string (1-2 sentences),
      "cook_time_minutes": number,
      "difficulty": "easy" | "medium" | "hard",
      "servings": number,
      "uses": string[] (ONLY from the available ingredients list above),
      "missing": string[] (optional ingredients NOT in available list),
      "steps": [
        { "step_number": number, "instruction": string, "timer_seconds": number | null }
      ],
      "usage_ratio": number (uses.length / total available ingredients, 0-1)
    }
  ]
}`
}

function buildUserPrompt(
  ingredients: string[],
  preferences?: PreferencesInput
): string {
  const parts: string[] = [
    `Available ingredients: ${ingredients.join(', ')}`,
  ]

  if (preferences) {
    if (preferences.cook_time_max) {
      parts.push(`Maximum cook time: ${preferences.cook_time_max} minutes`)
    }
    if (preferences.diet_tags?.length) {
      parts.push(`Dietary requirements: ${preferences.diet_tags.join(', ')}`)
    }
    if (preferences.allergy_tags?.length) {
      parts.push(`Allergies to avoid: ${preferences.allergy_tags.join(', ')}`)
    }
    if (preferences.cuisine_tags?.length) {
      parts.push(`Preferred cuisines: ${preferences.cuisine_tags.join(', ')}`)
    }
    if (preferences.equipment_tags?.length) {
      parts.push(`Available equipment: ${preferences.equipment_tags.join(', ')}`)
    }
    if (preferences.servings) {
      parts.push(`Servings needed: ${preferences.servings}`)
    }
  }

  parts.push(
    'Generate 3-5 recipes that maximize use of the available ingredients.',
    'Prioritize recipes using the most available ingredients.',
    'Keep missing ingredients minimal — only truly essential items.',
    'Return the JSON response following the schema exactly.'
  )

  return parts.join('\n')
}

export async function runRecipeGeneration(
  ingredients: string[],
  preferences?: PreferencesInput
): Promise<RecipeGenerationResult & { latencyMs: number }> {
  const result = await callAI(
    {
      systemPrompt: buildSystemPrompt(ingredients),
      userPrompt: buildUserPrompt(ingredients, preferences),
      maxTokens: 4096,
    },
    RecipeGenerationResultSchema
  )

  // Post-validate: ensure uses[] only contains items from canonical list
  const ingredientSet = new Set(ingredients)
  const cleaned = result.data.recipes.map((recipe) => ({
    ...recipe,
    uses: recipe.uses.filter((u) => ingredientSet.has(u)),
    usage_ratio: recipe.uses.filter((u) => ingredientSet.has(u)).length / Math.max(ingredients.length, 1),
  }))

  return {
    recipes: cleaned,
    latencyMs: result.latencyMs,
  }
}
