import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system/legacy'
import { IMAGE_MAX_DIMENSION, IMAGE_COMPRESS_QUALITY, MAX_IMAGE_SIZE_BYTES } from '@fridgechef/shared'
import { api } from './api'

export interface PreparedImage {
  uri: string
  mimeType: 'image/jpeg'
  sizeBytes: number
}

export interface UploadedImage {
  storageKey: string
  sizeBytes: number
}

/**
 * Resize + compress an image before upload.
 * Returns a local URI pointing to the processed file.
 */
export async function prepareImage(sourceUri: string): Promise<PreparedImage> {
  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: IMAGE_MAX_DIMENSION } }],
    {
      compress: IMAGE_COMPRESS_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  )

  const info = await FileSystem.getInfoAsync(result.uri, { size: true })
  if (!info.exists) throw new Error('Failed to prepare image')

  const sizeBytes = (info as any).size as number

  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    // Second pass with lower quality if still too large
    const compressed = await ImageManipulator.manipulateAsync(
      result.uri,
      [],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    )
    const info2 = await FileSystem.getInfoAsync(compressed.uri, { size: true })
    return {
      uri: compressed.uri,
      mimeType: 'image/jpeg',
      sizeBytes: (info2 as any).size ?? sizeBytes,
    }
  }

  return { uri: result.uri, mimeType: 'image/jpeg', sizeBytes }
}

/**
 * Upload a prepared image to Supabase Storage via presigned URL.
 */
export async function uploadImage(
  sessionId: string,
  image: PreparedImage,
  onProgress?: (progress: number) => void
): Promise<UploadedImage> {
  // Get presigned URL from backend
  const { upload_url, storage_key } = await api.getUploadUrl(sessionId)

  // Read file as base64 — FileSystem.uploadAsync handles the PUT
  const uploadResult = await FileSystem.uploadAsync(upload_url, image.uri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': image.mimeType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  })

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`Upload failed with status ${uploadResult.status}`)
  }

  // Confirm with backend
  await api.confirmImage(sessionId, {
    storage_key,
    size_bytes: image.sizeBytes,
    mime_type: image.mimeType,
  })

  return { storageKey: storage_key, sizeBytes: image.sizeBytes }
}

/**
 * Prepare and upload multiple images sequentially, reporting per-image progress.
 */
export async function uploadImages(
  sessionId: string,
  uris: string[],
  onProgress: (current: number, total: number) => void
): Promise<UploadedImage[]> {
  const results: UploadedImage[] = []

  for (let i = 0; i < uris.length; i++) {
    onProgress(i, uris.length)
    const prepared = await prepareImage(uris[i])
    const uploaded = await uploadImage(sessionId, prepared)
    results.push(uploaded)
    onProgress(i + 1, uris.length)
  }

  return results
}
