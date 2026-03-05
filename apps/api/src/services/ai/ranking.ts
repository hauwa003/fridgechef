import type { Recipe } from '@fridgechef/shared'

interface RankInput {
  recipe: Omit<Recipe, 'id' | 'session_id' | 'source'>
  cookTimeMax?: number | null
}

/**
 * Score = usage_ratio - (missing_penalty) - (time_overage_penalty)
 * Higher is better.
 */
export function scoreRecipe(input: RankInput): number {
  const { recipe, cookTimeMax } = input

  const usageScore = recipe.usage_ratio // 0–1, higher = uses more of what you have
  const missingPenalty = recipe.missing.length * 0.05 // -0.05 per missing ingredient

  let timeOveragePenalty = 0
  if (cookTimeMax && recipe.cook_time_minutes > cookTimeMax) {
    const overageMinutes = recipe.cook_time_minutes - cookTimeMax
    timeOveragePenalty = Math.min(overageMinutes / 60, 0.3) // cap at -0.3
  }

  return usageScore - missingPenalty - timeOveragePenalty
}

export function rankRecipes<T extends RankInput>(
  recipes: T[],
  cookTimeMax?: number | null
): T[] {
  return [...recipes].sort(
    (a, b) =>
      scoreRecipe({ ...b, cookTimeMax }) - scoreRecipe({ ...a, cookTimeMax })
  )
}
