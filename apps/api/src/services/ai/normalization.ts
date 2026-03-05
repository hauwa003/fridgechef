// Alias map: key = raw name → value = canonical name
const ALIASES: Record<string, string> = {
  'capsicum': 'bell pepper',
  'aubergine': 'eggplant',
  'courgette': 'zucchini',
  'coriander': 'cilantro',
  'rocket': 'arugula',
  'prawns': 'shrimp',
  'mince': 'ground beef',
  'spring onion': 'scallion',
  'maize': 'corn',
  'beetroot': 'beet',
  'plain flour': 'all-purpose flour',
  'double cream': 'heavy cream',
  'single cream': 'light cream',
  'natural yogurt': 'plain yogurt',
  'passata': 'tomato sauce',
  'tinned tomatoes': 'canned tomatoes',
  'tin of tomatoes': 'canned tomatoes',
}

// Simple plural → singular for common food nouns
const PLURAL_RULES: [RegExp, string][] = [
  [/^tomatoes$/, 'tomato'],
  [/^potatoes$/, 'potato'],
  [/^avocados$/, 'avocado'],
  [/^mangoes$/, 'mango'],
  [/^peppers$/, 'pepper'],
  [/^mushrooms$/, 'mushroom'],
  [/^onions$/, 'onion'],
  [/^carrots$/, 'carrot'],
  [/^eggs$/, 'egg'],
  [/^lemons$/, 'lemon'],
  [/^limes$/, 'lime'],
  [/^oranges$/, 'orange'],
  [/^apples$/, 'apple'],
  [/^bananas$/, 'banana'],
  [/^strawberries$/, 'strawberry'],
  [/^blueberries$/, 'blueberry'],
  [/^grapes$/, 'grape'],
  [/^cloves$/, 'clove'],
  // Generic: words ending in 's' that aren't already handled
  // Only apply if > 5 chars to avoid "peas" → "pea" false positives
]

export interface RawIngredient {
  name: string
  confidence: number
  notes?: string
}

export interface NormalizedIngredient {
  name: string
  confidence: number
  source: 'vision'
}

export function normalizeIngredients(raw: RawIngredient[]): NormalizedIngredient[] {
  const seen = new Map<string, NormalizedIngredient>()

  for (const item of raw) {
    const normalized = normalizeName(item.name)
    if (!normalized) continue

    const existing = seen.get(normalized)
    if (existing) {
      // Keep highest confidence on duplicates
      if (item.confidence > existing.confidence) {
        seen.set(normalized, { name: normalized, confidence: item.confidence, source: 'vision' })
      }
    } else {
      seen.set(normalized, { name: normalized, confidence: item.confidence, source: 'vision' })
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence)
}

function normalizeName(raw: string): string {
  let name = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\-]/g, '') // strip punctuation
    .replace(/\s+/g, ' ')

  if (!name) return ''

  // Apply alias map
  if (ALIASES[name]) {
    name = ALIASES[name]
  }

  // Apply plural rules
  for (const [pattern, replacement] of PLURAL_RULES) {
    if (pattern.test(name)) {
      name = replacement
      break
    }
  }

  return name
}
