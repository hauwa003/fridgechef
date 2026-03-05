import type { FastifyRequest, FastifyReply } from 'fastify'
import { supabase } from '../plugins/supabase.js'

export interface AuthUser {
  id: string
  isAnonymous: boolean
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing token' })
  }

  const token = authHeader.slice(7)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token' })
  }

  const isAnonymous = data.user.app_metadata?.provider === 'anonymous' ||
    !data.user.email

  request.authUser = { id: data.user.id, isAnonymous }
}
