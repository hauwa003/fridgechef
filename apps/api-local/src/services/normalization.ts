const ALIASES: Record<string, string> = {
  'capsicum': 'bell pepper', 'aubergine': 'eggplant', 'courgette': 'zucchini',
  'coriander': 'cilantro', 'rocket': 'arugula', 'prawns': 'shrimp',
  'spring onion': 'scallion', 'beetroot': 'beet', 'passata': 'tomato sauce',
}

export function normalizeIngredients(raw: { name: string; confidence: number }[]) {
  const seen = new Map<string, { name: string; confidence: number }>()
  for (const item of raw) {
    let name = item.name.toLowerCase().trim().replace(/[^a-z0-9\s\-]/g, '').replace(/\s+/g, ' ')
    if (!name) continue
    name = ALIASES[name] ?? name
    const existing = seen.get(name)
    if (!existing || item.confidence > existing.confidence) {
      seen.set(name, { name, confidence: item.confidence })
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence)
}
