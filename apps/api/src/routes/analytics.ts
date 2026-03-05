import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../plugins/supabase.js'
import { BatchAnalyticsSchema } from '@fridgechef/shared'

export async function analyticsRoutes(app: FastifyInstance) {
  // Batch event ingestion — fire and forget from mobile
  app.post('/events', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser!.id
    const body = BatchAnalyticsSchema.parse(request.body)

    const rows = body.events.map((e) => ({
      user_id: userId,
      session_id: e.session_id ?? null,
      event_name: e.event_name,
      properties: e.properties ?? {},
      occurred_at: e.occurred_at ?? new Date().toISOString(),
    }))

    // Insert async — don't fail the request if analytics fail
    supabase.from('analytics_events').insert(rows).then(({ error }) => {
      if (error) {
        request.log.warn({ err: error }, 'Analytics insert failed')
      }
    })

    return reply.status(202).send({ accepted: rows.length })
  })
}
