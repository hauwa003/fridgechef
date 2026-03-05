import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

if (!url || !token) {
  throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN')
}

export const redis = new Redis({ url, token })

// Session lock helpers (prevent duplicate concurrent AI calls)
export async function acquireSessionLock(sessionId: string): Promise<boolean> {
  const key = `lock:session:${sessionId}`
  const result = await redis.set(key, '1', { nx: true, ex: 60 })
  return result === 'OK'
}

export async function releaseSessionLock(sessionId: string): Promise<void> {
  await redis.del(`lock:session:${sessionId}`)
}
