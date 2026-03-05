import { z } from 'zod'

// --- AI Output Schemas ---

export const ExtractionResultSchema = z.object({
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      confidence: z.number().min(0).max(1),
      notes: z.string().optional(),
    })
  ),
  warnings: z
    .array(z.enum(['low_light', 'blurry', 'occluded']))
    .optional()
    .default([]),
})

export const RecipeStepSchema = z.object({
  step_number: z.number().int().positive(),
  instruction: z.string().min(1),
  timer_seconds: z.number().int().positive().nullable().optional(),
})

export const RecipeSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  cook_time_minutes: z.number().int().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  servings: z.number().int().min(1).max(12),
  uses: z.array(z.string()),
  missing: z.array(z.string()),
  steps: z.array(RecipeStepSchema),
  usage_ratio: z.number().min(0).max(1),
})

export const RecipeGenerationResultSchema = z.object({
  recipes: z.array(RecipeSchema).min(1).max(5),
})

// --- API Request Schemas ---

export const CreateSessionSchema = z.object({
  // no body required
})

export const ConfirmImageSchema = z.object({
  storage_key: z.string().min(1),
  size_bytes: z.number().int().positive(),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/heic']),
})

export const UpdateIngredientsSchema = z.object({
  ingredients: z.array(
    z.object({
      id: z.string().optional(), // omit for new manual ingredients
      name: z.string().min(1),
      is_active: z.boolean(),
    })
  ),
})

export const PreferencesSchema = z.object({
  cook_time_max: z.number().int().positive().nullable().optional(),
  diet_tags: z.array(z.string()).optional().default([]),
  allergy_tags: z.array(z.string()).optional().default([]),
  cuisine_tags: z.array(z.string()).optional().default([]),
  equipment_tags: z.array(z.string()).optional().default([]),
  servings: z.number().int().min(1).max(12).optional().default(2),
})

export const GenerateRecipesSchema = z.object({
  preferences: PreferencesSchema.optional(),
})

export const AnalyticsEventSchema = z.object({
  event_name: z.string().min(1),
  session_id: z.string().uuid().optional(),
  properties: z.record(z.unknown()).optional().default({}),
  occurred_at: z.string().datetime().optional(),
})

export const BatchAnalyticsSchema = z.object({
  events: z.array(AnalyticsEventSchema).min(1).max(50),
})

// --- Types inferred from schemas ---

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>
export type RecipeGenerationResult = z.infer<typeof RecipeGenerationResultSchema>
export type ConfirmImageInput = z.infer<typeof ConfirmImageSchema>
export type UpdateIngredientsInput = z.infer<typeof UpdateIngredientsSchema>
export type PreferencesInput = z.infer<typeof PreferencesSchema>
export type GenerateRecipesInput = z.infer<typeof GenerateRecipesSchema>
export type AnalyticsEventInput = z.infer<typeof AnalyticsEventSchema>
