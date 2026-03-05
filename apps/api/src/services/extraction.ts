import { supabase } from '../plugins/supabase.js'
import { deleteSessionImages, shouldRetainPhotos, getSignedImageUrl } from './storage.js'
import { runVisionExtraction } from './ai/visionAdapter.js'
import { normalizeIngredients } from './ai/normalization.js'
import type { ExtractionResult } from '@fridgechef/shared'

/**
 * Extracts ingredients from session images using Claude vision.
 * - Fetches session images
 * - Generates short-lived signed URLs for Claude
 * - Runs vision extraction + normalization
 * - Persists results and updates session state
 */
export async function extractIngredients(sessionId: string): Promise<ExtractionResult> {
  // 1. Fetch session images
  const { data: images, error: imgError } = await supabase
    .from('session_images')
    .select('id, storage_key')
    .eq('session_id', sessionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (imgError || !images?.length) {
    throw Object.assign(new Error('No images found for session'), { code: 'NO_IMAGES' })
  }

  // 2. Generate signed read URLs (5 min TTL, only used for this call)
  const signedUrls = await Promise.all(
    images.map((img) => getSignedImageUrl(img.storage_key, 300))
  )

  // 3. Call Claude vision
  const visionResult = await runVisionExtraction(signedUrls)

  // 4. Normalize ingredients
  const normalized = normalizeIngredients(visionResult.ingredients)

  // 5. Persist ingredients
  if (normalized.length > 0) {
    const rows = normalized.map((ing) => ({
      session_id: sessionId,
      name: ing.name,
      confidence: ing.confidence,
      source: ing.source,
      is_active: true,
    }))

    const { error: insertError } = await supabase.from('ingredients').insert(rows)
    if (insertError) {
      throw Object.assign(new Error('Failed to persist ingredients'), { code: 'DB_ERROR' })
    }
  }

  // 6. Update session state
  await supabase
    .from('sessions')
    .update({ state: 'EXTRACTED' })
    .eq('id', sessionId)

  return {
    ingredients: normalized.map((i) => ({
      name: i.name,
      confidence: i.confidence,
    })),
    warnings: visionResult.warnings ?? [],
  }
}

/**
 * Deletes session images if user has not enabled photo retention.
 * Call this after successful extraction.
 */
export async function maybeDeleteImages(sessionId: string, userId: string): Promise<void> {
  const retain = await shouldRetainPhotos(userId)
  if (!retain) {
    await deleteSessionImages(sessionId)
  }
}
