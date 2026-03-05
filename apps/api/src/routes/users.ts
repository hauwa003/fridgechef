import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../plugins/supabase.js'
import { PreferencesSchema } from '@fridgechef/shared'

export async function userRoutes(app: FastifyInstance) {
  // Get saved recipes
  app.get('/me/saved', { preHandler: requireAuth }, async (request) => {
    const userId = request.authUser!.id

    const { data } = await supabase
      .from('saved_recipes')
      .select('*, recipe:recipes(*)')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })

    return { saved: data ?? [] }
  })

  // Get session history
  app.get('/me/history', { preHandler: requireAuth }, async (request) => {
    const userId = request.authUser!.id

    const { data } = await supabase
      .from('sessions')
      .select('id, state, created_at, ingredients(name, is_active), recipes(id, title, cook_time_minutes)')
      .eq('user_id', userId)
      .eq('state', 'RECIPES_READY')
      .order('created_at', { ascending: false })
      .limit(50)

    return { sessions: data ?? [] }
  })

  // Get preferences
  app.get('/me/preferences', { preHandler: requireAuth }, async (request) => {
    const userId = request.authUser!.id

    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    return { preferences: data ?? null }
  })

  // Update preferences
  app.put('/me/preferences', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser!.id
    const body = PreferencesSchema.parse(request.body)

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, ...body }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      return reply.status(500).send({ error: 'PREFERENCES_UPDATE_FAILED' })
    }

    return { preferences: data }
  })

  // Delete account
  app.delete('/me', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser!.id

    // Cascade deletes handle all related data via FK constraints
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      return reply.status(500).send({ error: 'DELETE_FAILED' })
    }

    return reply.status(204).send()
  })
}
