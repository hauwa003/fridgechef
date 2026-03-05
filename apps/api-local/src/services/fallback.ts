import type { PreferencesInput } from './schemas.js'

const SEEDS = [
  { title: 'Scrambled Eggs', description: 'Creamy scrambled eggs.', cook_time_minutes: 10, difficulty: 'easy', servings: 2, required: ['egg'], optional: ['butter', 'milk', 'cheese'], steps: [{ step_number: 1, instruction: 'Whisk eggs with a splash of milk.', timer_seconds: null }, { step_number: 2, instruction: 'Cook in buttered pan over low heat, stirring constantly.', timer_seconds: 180 }, { step_number: 3, instruction: 'Season and serve immediately.', timer_seconds: null }] },
  { title: 'Garlic Pasta', description: 'Quick pasta with garlic and olive oil.', cook_time_minutes: 20, difficulty: 'easy', servings: 2, required: ['pasta', 'garlic'], optional: ['parmesan', 'olive oil'], steps: [{ step_number: 1, instruction: 'Boil pasta in salted water until al dente.', timer_seconds: 600 }, { step_number: 2, instruction: 'Sauté garlic in olive oil until golden.', timer_seconds: 180 }, { step_number: 3, instruction: 'Toss pasta with garlic oil and parmesan.', timer_seconds: null }] },
  { title: 'Tomato Omelette', description: 'Fluffy omelette with tomatoes.', cook_time_minutes: 12, difficulty: 'easy', servings: 1, required: ['egg', 'tomato'], optional: ['cheese', 'butter'], steps: [{ step_number: 1, instruction: 'Beat 3 eggs with salt and pepper.', timer_seconds: null }, { step_number: 2, instruction: 'Cook in buttered pan, add diced tomatoes when edges set.', timer_seconds: 120 }, { step_number: 3, instruction: 'Fold and serve.', timer_seconds: null }] },
  { title: 'Cheese Toast', description: 'Golden toast with melted cheese.', cook_time_minutes: 8, difficulty: 'easy', servings: 1, required: ['bread', 'cheese'], optional: ['butter', 'tomato'], steps: [{ step_number: 1, instruction: 'Place bread on baking tray and top with sliced cheese.', timer_seconds: null }, { step_number: 2, instruction: 'Grill until cheese is bubbly and golden.', timer_seconds: 300 }] },
  { title: 'Fried Rice', description: 'Quick stir-fried rice with vegetables.', cook_time_minutes: 15, difficulty: 'easy', servings: 2, required: ['rice'], optional: ['egg', 'onion', 'garlic', 'soy sauce'], steps: [{ step_number: 1, instruction: 'Heat oil in wok over high heat.', timer_seconds: null }, { step_number: 2, instruction: 'Stir-fry vegetables for 2 minutes.', timer_seconds: 120 }, { step_number: 3, instruction: 'Add rice and soy sauce, toss until hot.', timer_seconds: 180 }] },
  { title: 'Vegetable Soup', description: 'Warming soup with whatever you have.', cook_time_minutes: 30, difficulty: 'easy', servings: 4, required: ['onion'], optional: ['carrot', 'potato', 'garlic', 'tomato', 'celery'], steps: [{ step_number: 1, instruction: 'Sauté onion and garlic in oil until soft.', timer_seconds: 180 }, { step_number: 2, instruction: 'Add chopped vegetables and cover with water.', timer_seconds: null }, { step_number: 3, instruction: 'Simmer for 20 minutes until tender. Season to taste.', timer_seconds: 1200 }] },
  { title: 'Avocado Toast', description: 'Creamy avocado on crispy toast.', cook_time_minutes: 8, difficulty: 'easy', servings: 1, required: ['avocado', 'bread'], optional: ['lemon', 'egg', 'tomato'], steps: [{ step_number: 1, instruction: 'Toast bread until golden.', timer_seconds: 180 }, { step_number: 2, instruction: 'Mash avocado with lemon juice, salt and pepper.', timer_seconds: null }, { step_number: 3, instruction: 'Spread on toast and add toppings.', timer_seconds: null }] },
  { title: 'Banana Pancakes', description: 'Two-ingredient banana pancakes.', cook_time_minutes: 15, difficulty: 'easy', servings: 2, required: ['banana', 'egg'], optional: ['butter', 'honey'], steps: [{ step_number: 1, instruction: 'Mash 2 ripe bananas until smooth.', timer_seconds: null }, { step_number: 2, instruction: 'Mix in 2 beaten eggs.', timer_seconds: null }, { step_number: 3, instruction: 'Cook spoonfuls in butter, 2 min per side.', timer_seconds: 120 }] },
]

function matches(canonical: string[], targets: string[]): string[] {
  return targets.filter((t) => canonical.some((c) => c.includes(t) || t.includes(c)))
}

export function getFallbackRecipes(canonical: string[], prefs?: PreferencesInput, count = 5) {
  const results = SEEDS
    .map((seed) => {
      const reqMatched = matches(canonical, seed.required)
      if (reqMatched.length === 0) return null
      const optMatched = matches(canonical, seed.optional)
      const uses = [...reqMatched, ...optMatched]
      const missing = seed.required.filter((r) => !reqMatched.includes(r))
      const usage_ratio = uses.length / Math.max(canonical.length, 1)
      const score = usage_ratio - missing.length * 0.1
      return { ...seed, uses, missing, usage_ratio, source: 'fallback' as const, score }
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score)
    .slice(0, count)
    .map((r, i) => ({ ...r!, id: `fallback-${i}` }))

  return results
}
