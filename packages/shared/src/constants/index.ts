export const SESSION_TTL_HOURS = 24

export const MAX_IMAGES_PER_SESSION = 3
export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024 // 4MB
export const IMAGE_MAX_DIMENSION = 1280
export const IMAGE_COMPRESS_QUALITY = 0.75

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MED: 0.60,
} as const

export const RATE_LIMITS = {
  ANONYMOUS: { sessions_per_day: 3 },
  FREE: { sessions_per_day: 10 },
} as const

export const RECIPE_COUNT = {
  MIN: 3,
  MAX: 5,
} as const

export const DIET_TAGS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'keto',
  'halal',
  'kosher',
] as const

export const CUISINE_TAGS = [
  'italian',
  'asian',
  'mexican',
  'mediterranean',
  'american',
  'indian',
  'french',
  'middle-eastern',
] as const

export const EQUIPMENT_TAGS = [
  'oven',
  'stovetop',
  'microwave',
  'air-fryer',
  'instant-pot',
  'no-equipment',
] as const

export const COOK_TIME_OPTIONS = [15, 30, 60] as const
