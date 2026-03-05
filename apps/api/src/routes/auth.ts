import type { FastifyInstance } from 'fastify'
import { supabase } from '../plugins/supabase.js'

export async function authRoutes(app: FastifyInstance) {
  // Create anonymous session — called on first app launch
  app.post('/anonymous', async (request, reply) => {
    const { data, error } = await supabase.auth.signInAnonymously()

    if (error || !data.session) {
      request.log.error({ err: error }, 'Failed to create anonymous session')
      return reply.status(500).send({
        error: 'AUTH_FAILED',
        message: 'Failed to create anonymous session',
      })
    }

    // Upsert user record
    await supabase.from('users').upsert(
      { id: data.user!.id },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    return reply.status(201).send({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user_id: data.user!.id,
    })
  })

  // Refresh token
  app.post('/refresh', async (request, reply) => {
    const { refresh_token } = request.body as { refresh_token?: string }
    if (!refresh_token) {
      return reply.status(400).send({ error: 'MISSING_REFRESH_TOKEN' })
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token })
    if (error || !data.session) {
      return reply.status(401).send({ error: 'INVALID_REFRESH_TOKEN' })
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    }
  })
}
