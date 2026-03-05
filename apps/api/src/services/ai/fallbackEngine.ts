import { rankRecipes } from './ranking.js'
import type { Recipe } from '@fridgechef/shared'
import type { PreferencesInput } from '@fridgechef/shared'

// Seed recipes used when AI is unavailable
const SEED_RECIPES: Omit<Recipe, 'id' | 'session_id' | 'source' | 'uses' | 'missing' | 'usage_ratio'>[] = [
  {
    title: 'Classic Scrambled Eggs',
    description: 'Simple, creamy scrambled eggs ready in minutes.',
    cook_time_minutes: 10,
    difficulty: 'easy',
    servings: 2,
    steps: [
      { step_number: 1, instruction: 'Crack eggs into a bowl, add a splash of milk and whisk well.', timer_seconds: null },
      { step_number: 2, instruction: 'Melt butter in a pan over low heat.', timer_seconds: null },
      { step_number: 3, instruction: 'Pour in eggs and stir slowly with a spatula until just set.', timer_seconds: 180 },
      { step_number: 4, instruction: 'Season with salt and pepper, serve immediately.', timer_seconds: null },
    ],
  },
  {
    title: 'Garlic Pasta',
    description: 'A quick and satisfying pasta with garlic, olive oil, and parmesan.',
    cook_time_minutes: 20,
    difficulty: 'easy',
    servings: 2,
    steps: [
      { step_number: 1, instruction: 'Cook pasta in salted boiling water until al dente.', timer_seconds: 600 },
      { step_number: 2, instruction: 'Heat olive oil in a pan and sauté sliced garlic until golden.', timer_seconds: 180 },
      { step_number: 3, instruction: 'Toss drained pasta with garlic oil. Season generously.', timer_seconds: null },
      { step_number: 4, instruction: 'Top with grated parmesan and serve hot.', timer_seconds: null },
    ],
  },
  {
    title: 'Tomato Omelette',
    description: 'A fluffy omelette filled with fresh tomatoes and herbs.',
    cook_time_minutes: 15,
    difficulty: 'easy',
    servings: 1,
    steps: [
      { step_number: 1, instruction: 'Beat 3 eggs with salt, pepper, and a splash of water.', timer_seconds: null },
      { step_number: 2, instruction: 'Dice tomatoes and set aside.', timer_seconds: null },
      { step_number: 3, instruction: 'Heat butter in a pan and pour in the egg mixture.', timer_seconds: null },
      { step_number: 4, instruction: 'When edges set, add tomatoes and fold omelette in half.', timer_seconds: 120 },
    ],
  },
  {
    title: 'Stir-Fried Rice',
    description: 'Quick fried rice using leftover cooked rice and vegetables.',
    cook_time_minutes: 15,
    difficulty: 'easy',
    servings: 2,
    steps: [
      { step_number: 1, instruction: 'Heat oil in a wok or large pan over high heat.', timer_seconds: null },
      { step_number: 2, instruction: 'Add vegetables and stir-fry for 2 minutes.', timer_seconds: 120 },
      { step_number: 3, instruction: 'Push to the side, scramble an egg in the centre.', timer_seconds: null },
      { step_number: 4, instruction: 'Add rice and soy sauce, toss everything together until hot.', timer_seconds: 180 },
    ],
  },
  {
    title: 'Cheese Toast',
    description: 'Golden toasted bread with melted cheese — a timeless classic.',
    cook_time_minutes: 8,
    difficulty: 'easy',
    servings: 1,
    steps: [
      { step_number: 1, instruction: 'Slice bread and lay on a baking tray.', timer_seconds: null },
      { step_number: 2, instruction: 'Top with sliced or grated cheese.', timer_seconds: null },
      { step_number: 3, instruction: 'Grill or broil until cheese is bubbly and golden.', timer_seconds: 300 },
    ],
  },
  {
    title: 'Vegetable Soup',
    description: 'A hearty and warming soup with whatever vegetables you have.',
    cook_time_minutes: 35,
    difficulty: 'easy',
    servings: 4,
    steps: [
      { step_number: 1, instruction: 'Chop all vegetables into bite-sized pieces.', timer_seconds: null },
      { step_number: 2, instruction: 'Sauté onion and garlic in oil until soft.', timer_seconds: 180 },
      { step_number: 3, instruction: 'Add remaining vegetables and cover with water or stock.', timer_seconds: null },
      { step_number: 4, instruction: 'Simmer for 20 minutes until vegetables are tender. Season and serve.', timer_seconds: 1200 },
    ],
  },
  {
    title: 'Banana Pancakes',
    description: 'Two-ingredient pancakes made from bananas and eggs.',
    cook_time_minutes: 15,
    difficulty: 'easy',
    servings: 2,
    steps: [
      { step_number: 1, instruction: 'Mash 2 ripe bananas until smooth.', timer_seconds: null },
      { step_number: 2, instruction: 'Mix in 2 beaten eggs until combined.', timer_seconds: null },
      { step_number: 3, instruction: 'Cook spoonfuls in a buttered pan over medium heat, 2 min per side.', timer_seconds: 120 },
    ],
  },
  {
    title: 'Avocado Toast',
    description: 'Creamy avocado on toasted bread with a squeeze of lemon.',
    cook_time_minutes: 8,
    difficulty: 'easy',
    servings: 1,
    steps: [
      { step_number: 1, instruction: 'Toast the bread until golden and crispy.', timer_seconds: 180 },
      { step_number: 2, instruction: 'Mash avocado with lemon juice, salt and pepper.', timer_seconds: null },
      { step_number: 3, instruction: 'Spread avocado on toast. Add toppings as desired.', timer_seconds: null },
    ],
  },
]

// Maps seed recipe titles to the core ingredients they need
const RECIPE_INGREDIENTS: Record<string, { required: string[]; optional: string[] }> = {
  'Classic Scrambled Eggs': { required: ['egg'], optional: ['milk', 'butter', 'cheese'] },
  'Garlic Pasta': { required: ['pasta', 'garlic'], optional: ['parmesan', 'olive oil', 'pepper'] },
  'Tomato Omelette': { required: ['egg', 'tomato'], optional: ['butter', 'herb'] },
  'Stir-Fried Rice': { required: ['rice'], optional: ['egg', 'soy sauce', 'vegetable', 'onion', 'garlic'] },
  'Cheese Toast': { required: ['bread', 'cheese'], optional: ['butter'] },
  'Vegetable Soup': { required: ['onion'], optional: ['carrot', 'potato', 'celery', 'garlic', 'tomato', 'zucchini'] },
  'Banana Pancakes': { required: ['banana', 'egg'], optional: ['butter'] },
  'Avocado Toast': { required: ['avocado', 'bread'], optional: ['lemon', 'egg', 'tomato'] },
}

function ingredientMatches(canonical: string[], targets: string[]): string[] {
  return targets.filter((target) =>
    canonical.some(
      (c) => c.includes(target) || target.includes(c) || levenshteinClose(c, target)
    )
  )
}

function levenshteinClose(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 2) return false
  let matches = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++
  }
  return matches / Math.max(a.length, b.length) > 0.7
}

export function getFallbackRecipes(
  canonicalIngredients: string[],
  preferences?: PreferencesInput,
  count = 5
): Omit<Recipe, 'id' | 'session_id'>[] {
  const results: (Omit<Recipe, 'id' | 'session_id'> & { score: number })[] = []

  for (const seed of SEED_RECIPES) {
    const meta = RECIPE_INGREDIENTS[seed.title]
    if (!meta) continue

    // Skip if required ingredients are completely missing
    const requiredMatched = ingredientMatches(canonicalIngredients, meta.required)
    if (requiredMatched.length === 0) continue

    const optionalMatched = ingredientMatches(canonicalIngredients, meta.optional)
    const uses = [...requiredMatched, ...optionalMatched]
    const missing = meta.required.filter((r) => !requiredMatched.includes(r))

    const usage_ratio = uses.length / Math.max(canonicalIngredients.length, 1)

    if (preferences?.cook_time_max && seed.cook_time_minutes > preferences.cook_time_max * 1.5) {
      continue // skip recipes wildly over time limit
    }

    const score = usage_ratio - missing.length * 0.1
    results.push({ ...seed, uses, missing, usage_ratio, source: 'fallback', score })
  }

  // Rank and return top N
  const ranked = rankRecipes(
    results.map((r) => ({ recipe: r, cookTimeMax: preferences?.cook_time_max })),
    preferences?.cook_time_max
  )

  return ranked
    .slice(0, count)
    .map(({ recipe }) => recipe)
}
