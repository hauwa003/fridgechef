import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../plugins/supabase.js'

export async function recipeRoutes(app: FastifyInstance) {
  // Get recipe by ID
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data: recipe } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single()

    if (!recipe) {
      return reply.status(404).send({ error: 'RECIPE_NOT_FOUND' })
    }

    return { recipe }
  })

  // Save a recipe
  app.post('/:id/save', { preHandler: requireAuth }, async (request, reply) => {
    const { id: recipeId } = request.params as { id: string }
    const userId = request.authUser!.id

    const { error } = await supabase
      .from('saved_recipes')
      .upsert({ user_id: userId, recipe_id: recipeId }, { onConflict: 'user_id,recipe_id' })

    if (error) {
      return reply.status(500).send({ error: 'SAVE_FAILED' })
    }

    return reply.status(201).send({ saved: true })
  })

  // Unsave a recipe
  app.delete('/:id/save', { preHandler: requireAuth }, async (request, reply) => {
    const { id: recipeId } = request.params as { id: string }
    const userId = request.authUser!.id

    await supabase
      .from('saved_recipes')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)

    return { saved: false }
  })
}
