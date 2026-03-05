import { supabase } from '../plugins/supabase.js'
import { runRecipeGeneration } from './ai/recipeAdapter.js'
import { getFallbackRecipes } from './ai/fallbackEngine.js'
import { rankRecipes } from './ai/ranking.js'
import type { Recipe, PreferencesInput } from '@fridgechef/shared'
import { RECIPE_COUNT } from '@fridgechef/shared'

/**
 * Generates ranked recipes from canonical ingredients + preferences using Claude.
 * Falls back to seed recipes if AI fails or circuit breaker is open.
 */
export async function generateRecipes(
  sessionId: string,
  userId: string,
  preferences?: PreferencesInput
): Promise<Recipe[]> {
  // 1. Fetch canonical ingredient list
  const { data: ingredients, error: ingError } = await supabase
    .from('ingredients')
    .select('name')
    .eq('session_id', sessionId)
    .eq('is_active', true)

  if (ingError || !ingredients?.length) {
    throw Object.assign(new Error('No ingredients found for session'), { code: 'NO_INGREDIENTS' })
  }

  const canonicalNames = ingredients.map((i) => i.name)

  // 2. Merge user default preferences with session overrides
  const mergedPreferences = await mergePreferences(userId, preferences)

  // 3. Generate recipes (with fallback)
  let recipeData: Omit<Recipe, 'id' | 'session_id'>[]
  let source: 'ai' | 'fallback' = 'ai'

  try {
    const result = await runRecipeGeneration(canonicalNames, mergedPreferences)
    recipeData = result.recipes.map((r) => ({ ...r, source: 'ai' as const }))
  } catch (err: any) {
    // Circuit open or AI failed — use fallback
    if (err.code === 'CIRCUIT_OPEN' || err.code === 'SCHEMA_VALIDATION_FAILED') {
      recipeData = getFallbackRecipes(canonicalNames, mergedPreferences, RECIPE_COUNT.MAX)
      source = 'fallback'
    } else {
      throw err
    }
  }

  // 4. Rank recipes
  const ranked = rankRecipes(
    recipeData.map((r) => ({ recipe: r, cookTimeMax: mergedPreferences?.cook_time_max })),
    mergedPreferences?.cook_time_max
  )
    .slice(0, RECIPE_COUNT.MAX)
    .map(({ recipe }) => recipe)

  // 5. Persist to DB
  const rows = ranked.map((r) => ({
    session_id: sessionId,
    title: r.title,
    description: r.description,
    cook_time_minutes: r.cook_time_minutes,
    difficulty: r.difficulty,
    servings: r.servings ?? mergedPreferences?.servings ?? 2,
    usage_ratio: r.usage_ratio,
    uses: r.uses,
    missing: r.missing,
    steps: r.steps,
    source,
  }))

  const { data: saved, error: saveError } = await supabase
    .from('recipes')
    .insert(rows)
    .select()

  if (saveError || !saved) {
    throw Object.assign(new Error('Failed to persist recipes'), { code: 'DB_ERROR' })
  }

  // 6. Update session state
  await supabase
    .from('sessions')
    .update({ state: 'RECIPES_READY' })
    .eq('id', sessionId)

  return saved as Recipe[]
}

async function mergePreferences(
  userId: string,
  sessionOverride?: PreferencesInput
): Promise<PreferencesInput | undefined> {
  const { data: userPrefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!userPrefs && !sessionOverride) return undefined

  return {
    cook_time_max: sessionOverride?.cook_time_max ?? userPrefs?.cook_time_max ?? null,
    diet_tags: sessionOverride?.diet_tags ?? userPrefs?.diet_tags ?? [],
    allergy_tags: sessionOverride?.allergy_tags ?? userPrefs?.allergy_tags ?? [],
    cuisine_tags: sessionOverride?.cuisine_tags ?? userPrefs?.cuisine_tags ?? [],
    equipment_tags: sessionOverride?.equipment_tags ?? userPrefs?.equipment_tags ?? [],
    servings: sessionOverride?.servings ?? userPrefs?.servings ?? 2,
  }
}
