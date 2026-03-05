import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const UPLOAD_DIR = join(tmpdir(), 'fridgechef-uploads')

export async function saveUpload(key: string, data: Buffer): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(join(UPLOAD_DIR, key.replace(/\//g, '_')), data)
}

export async function getUploadPath(key: string): Promise<string> {
  return join(UPLOAD_DIR, key.replace(/\//g, '_'))
}

export async function deleteUpload(key: string): Promise<void> {
  try {
    await unlink(join(UPLOAD_DIR, key.replace(/\//g, '_')))
  } catch {
    // ignore if already deleted
  }
}
