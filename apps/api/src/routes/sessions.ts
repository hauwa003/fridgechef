import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../plugins/supabase.js'
import { acquireSessionLock, releaseSessionLock } from '../plugins/redis.js'
import {
  ConfirmImageSchema,
  UpdateIngredientsSchema,
  GenerateRecipesSchema,
} from '@fridgechef/shared'
import {
  MAX_IMAGES_PER_SESSION,
  MAX_IMAGE_SIZE_BYTES,
} from '@fridgechef/shared'

export async function sessionRoutes(app: FastifyInstance) {
  // Create a new session
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser!.id

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ user_id: userId })
      .select()
      .single()

    if (error) {
      request.log.error({ err: error }, 'Failed to create session')
      return reply.status(500).send({ error: 'SESSION_CREATE_FAILED' })
    }

    return reply.status(201).send({ session })
  })

  // Get session by ID
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.authUser!.id

    const { data: session } = await supabase
      .from('sessions')
      .select('*, ingredients(*), recipes(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!session) {
      return reply.status(404).send({ error: 'SESSION_NOT_FOUND' })
    }

    return { session }
  })

  // Get presigned upload URL for an image
  app.post('/:id/images/upload-url', { preHandler: requireAuth }, async (request, reply) => {
    const { id: sessionId } = request.params as { id: string }
    const userId = request.authUser!.id

    // Verify session ownership
    const { data: session } = await supabase
      .from('sessions')
      .select('id, state')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!session) {
      return reply.status(404).send({ error: 'SESSION_NOT_FOUND' })
    }

    // Check image count
    const { count } = await supabase
      .from('session_images')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .is('deleted_at', null)

    if ((count ?? 0) >= MAX_IMAGES_PER_SESSION) {
      return reply.status(400).send({
        error: 'MAX_IMAGES_REACHED',
        message: `Maximum ${MAX_IMAGES_PER_SESSION} images per session`,
      })
    }

    const storageKey = `sessions/${sessionId}/${crypto.randomUUID()}`
    const { data: signedUrl, error } = await supabase.storage
      .from('session-images')
      .createSignedUploadUrl(storageKey)

    if (error || !signedUrl) {
      return reply.status(500).send({ error: 'PRESIGN_FAILED' })
    }

    return {
      upload_url: signedUrl.signedUrl,
      storage_key: storageKey,
      expires_in: 300,
    }
  })

  // Confirm image uploaded
  app.post('/:id/images/confirm', { preHandler: requireAuth }, async (request, reply) => {
    const { id: sessionId } = request.params as { id: string }
    const userId = request.authUser!.id
    const body = ConfirmImageSchema.parse(request.body)

    // Verify session ownership
    const { data: session } = await supabase
      .from('sessions')
      .select('id, state')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!session) {
      return reply.status(404).send({ error: 'SESSION_NOT_FOUND' })
    }

    if (body.size_bytes > MAX_IMAGE_SIZE_BYTES) {
      return reply.status(400).send({ error: 'IMAGE_TOO_LARGE' })
    }

    const { data: image } = await supabase
      .from('session_images')
      .insert({
        session_id: sessionId,
        storage_key: body.storage_key,
        size_bytes: body.size_bytes,
        mime_type: body.mime_type,
      })
      .select()
      .single()

    // Update session state
    await supabase
      .from('sessions')
      .update({ state: 'IMAGES_UPLOADED' })
      .eq('id', sessionId)

    return reply.status(201).send({ image })
  })

  // Trigger ingredient extraction
  app.post('/:id/extract', { preHandler: requireAuth }, async (request, reply) => {
    const { id: sessionId } = request.params as { id: string }
    const userId = request.authUser!.id

    const { data: session } = await supabase
      .from('sessions')
      .select('id, state')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!session) {
      return reply.status(404).send({ error: 'SESSION_NOT_FOUND' })
    }

    if (session.state !== 'IMAGES_UPLOADED' && session.state !== 'EXTRACTING') {
      return reply.status(400).send({
        error: 'INVALID_STATE',
        message: `Cannot extract in state: ${session.state}`,
      })
    }

    const locked = await acquireSessionLock(sessionId)
    if (!locked) {
      return reply.status(409).send({ error: 'EXTRACTION_IN_PROGRESS' })
    }

    try {
      await supabase
        .from('sessions')
        .update({ state: 'EXTRACTING' })
        .eq('id', sessionId)

      // Delegate to extraction service (implemented in Phase 3)
      const { extractIngredients, maybeDeleteImages } = await import('../services/extraction.js')
      const result = await extractIngredients(sessionId)

      // Delete images post-extraction (respects user photo_retention setting)
      await maybeDeleteImages(sessionId, userId)

      return { ingredients: result.ingredients, warnings: result.warnings }
    } catch (err) {
      await supabase
        .from('sessions')
        .update({ state: 'FAILED', error_code: 'EXTRACTION_FAILED' })
        .eq('id', sessionId)

      request.log.error({ err, sessionId }, 'Extraction failed')
      return reply.status(500).send({ error: 'EXTRACTION_FAILED' })
    } finally {
      await releaseSessionLock(sessionId)
    }
  })

  // Update ingredient list (user edits)
  app.patch('/:id/ingredients', { preHandler: requireAuth }, async (request, reply) => {
    const { id: sessionId } = request.params as { id: string }
    const userId = request.authUser!.id
    const body = UpdateIngredientsSchema.parse(request.body)

    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!session) {
      return reply.status(404).send({ error: 'SESSION_NOT_FOUND' })
    }

    // Deactivate all existing vision ingredients first
    await supabase
      .from('ingredients')
      .update({ is_active: false })
      .eq('session_id', sessionId)

    // Upsert new list
    const rows = body.ingredients.map((ing) => ({
      id: ing.id ?? crypto.randomUUID(),
      session_id: sessionId,
      name: ing.name.toLowerCase().trim(),
      confidence: null,
      source: 'manual' as const,
      is_active: ing.is_active,
    }))

    const { data: updated } = await supabase
      .from('ingredients')
      .upsert(rows, { onConflict: 'id' })
      .select()

    return { ingredients: updated }
  })

  // Trigger recipe generation
  app.post('/:id/recipes', { preHandler: requireAuth }, async (request, reply) => {
    const { id: sessionId } = request.params as { id: string }
    const userId = request.authUser!.id
    const body = GenerateRecipesSchema.parse(request.body ?? {})

    const { data: session } = await supabase
      .from('sessions')
      .select('id, state')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!session) {
      return reply.status(404).send({ error: 'SESSION_NOT_FOUND' })
    }

    if (session.state !== 'EXTRACTED' && session.state !== 'RECIPES_READY') {
      return reply.status(400).send({
        error: 'INVALID_STATE',
        message: `Cannot generate recipes in state: ${session.state}`,
      })
    }

    const locked = await acquireSessionLock(sessionId)
    if (!locked) {
      return reply.status(409).send({ error: 'GENERATION_IN_PROGRESS' })
    }

    try {
      await supabase
        .from('sessions')
        .update({ state: 'GENERATING_RECIPES' })
        .eq('id', sessionId)

      const { generateRecipes } = await import('../services/recipes.js')
      const recipes = await generateRecipes(sessionId, userId, body.preferences)

      return { recipes }
    } catch (err) {
      await supabase
        .from('sessions')
        .update({ state: 'FAILED', error_code: 'GENERATION_FAILED' })
        .eq('id', sessionId)

      request.log.error({ err, sessionId }, 'Recipe generation failed')
      return reply.status(500).send({ error: 'GENERATION_FAILED' })
    } finally {
      await releaseSessionLock(sessionId)
    }
  })
}
