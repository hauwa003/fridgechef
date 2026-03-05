import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: true,
  enableOfflineQueue: false,
})

export async function acquireSessionLock(sessionId: string): Promise<boolean> {
  const result = await redis.set(`lock:${sessionId}`, '1', 'NX', 'EX', 60)
  return result === 'OK'
}

export async function releaseSessionLock(sessionId: string): Promise<void> {
  await redis.del(`lock:${sessionId}`)
}
