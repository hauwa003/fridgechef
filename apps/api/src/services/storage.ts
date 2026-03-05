import { supabase } from '../plugins/supabase.js'

/**
 * Deletes images from storage and marks them deleted in DB.
 * Called after successful ingredient extraction (if user has photo_retention = false).
 */
export async function deleteSessionImages(sessionId: string): Promise<void> {
  const { data: images } = await supabase
    .from('session_images')
    .select('id, storage_key')
    .eq('session_id', sessionId)
    .is('deleted_at', null)

  if (!images || images.length === 0) return

  const keys = images.map((img) => img.storage_key)

  // Delete from Supabase Storage
  const { error: storageError } = await supabase.storage
    .from('session-images')
    .remove(keys)

  if (storageError) {
    // Log but don't fail — DB record update still proceeds
    console.error('Storage deletion error:', storageError.message)
  }

  // Mark deleted in DB
  await supabase
    .from('session_images')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', images.map((img) => img.id))
}

/**
 * Checks whether the user has photo retention enabled.
 * Returns true if photos should be kept, false if they should be deleted.
 */
export async function shouldRetainPhotos(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('photo_retention')
    .eq('id', userId)
    .single()

  return data?.photo_retention ?? false
}

/**
 * Generates a signed read URL for an image (short-lived, for AI vision calls).
 */
export async function getSignedImageUrl(
  storageKey: string,
  expiresInSeconds = 300
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('session-images')
    .createSignedUrl(storageKey, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message}`)
  }

  return data.signedUrl
}
