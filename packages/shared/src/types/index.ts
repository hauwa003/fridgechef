export type SessionState =
  | 'CREATED'
  | 'IMAGES_UPLOADED'
  | 'EXTRACTING'
  | 'EXTRACTED'
  | 'GENERATING_RECIPES'
  | 'RECIPES_READY'
  | 'FAILED'

export type IngredientSource = 'vision' | 'manual'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type ConfidenceLevel = 'high' | 'med' | 'low'

export type ExtractionWarning = 'low_light' | 'blurry' | 'occluded'

export interface User {
  id: string
  anonymous_id: string | null
  provider: string | null
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  state: SessionState
  created_at: string
  updated_at: string
  expires_at: string
}

export interface Ingredient {
  id: string
  session_id: string
  name: string
  confidence: number
  source: IngredientSource
  is_active: boolean
}

export interface RecipeStep {
  step_number: number
  instruction: string
  timer_seconds?: number | null
}

export interface Recipe {
  id: string
  session_id: string
  title: string
  description: string
  cook_time_minutes: number
  difficulty: Difficulty
  servings: number
  usage_ratio: number
  uses: string[]
  missing: string[]
  steps: RecipeStep[]
  source: 'ai' | 'fallback'
}

export interface UserPreferences {
  cook_time_max: number | null
  diet_tags: string[]
  allergy_tags: string[]
  cuisine_tags: string[]
  equipment_tags: string[]
  servings: number
}

export interface SavedRecipe {
  id: string
  user_id: string
  recipe_id: string
  saved_at: string
  recipe: Recipe
}
