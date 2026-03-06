import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { sql } from './db/client.js'
import { redis, acquireSessionLock, releaseSessionLock } from './services/redis.js'
import { extractFromImages, generateRecipesAI } from './services/ai.js'
import { deleteUpload } from './services/storage.js'
import { readFile } from 'fs/promises'
import { UpdateIngredientsSchema, GenerateRecipesSchema, PreferencesSchema, BatchAnalyticsSchema } from './services/schemas.js'

const app = Fastify({
  logger: {
    transport: { target: 'pino-pretty' },
  },
  bodyLimit: 10 * 1024 * 1024, // 10MB
})

await app.register(cors, { origin: true })

// Accept raw binary bodies for image uploads
app.addContentTypeParser('image/jpeg', { parseAs: 'buffer' }, (_req, body, done) => done(null, body))
app.addContentTypeParser('image/png', { parseAs: 'buffer' }, (_req, body, done) => done(null, body))
app.addContentTypeParser('application/octet-stream', { parseAs: 'buffer' }, (_req, body, done) => done(null, body))

// ── Health ────────────────────────────────────────────────────────────────
app.get('/health', async () => ({ status: 'ok' }))

// ── Auth — simplified for local dev (no JWT validation) ──────────────────
app.post('/auth/anonymous', async (request, reply) => {
  const [user] = await sql`insert into users default values returning id`
  return reply.status(201).send({
    access_token: `local-token-${user.id}`,
    refresh_token: `local-refresh-${user.id}`,
    user_id: user.id,
  })
})

app.post('/auth/refresh', async (request, reply) => {
  const { refresh_token } = request.body as any
  const userId = refresh_token?.replace('local-refresh-', '')
  if (!userId) return reply.status(401).send({ error: 'INVALID' })
  return {
    access_token: `local-token-${userId}`,
    refresh_token,
  }
})

// ── Auth middleware (local: extract userId from token) ────────────────────
async function getUser(request: any, reply: any) {
  const auth = request.headers.authorization ?? ''
  const userId = auth.replace('Bearer local-token-', '')
  if (!userId || userId === auth) {
    return reply.status(401).send({ error: 'UNAUTHORIZED' })
  }
  request.userId = userId
}

// ── Sessions ──────────────────────────────────────────────────────────────
app.post('/sessions', { preHandler: getUser }, async (request: any, reply) => {
  const [session] = await sql`
    insert into sessions (user_id) values (${request.userId}) returning *`
  return reply.status(201).send({ session })
})

app.get('/sessions/:id', { preHandler: getUser }, async (request: any, reply) => {
  const { id } = request.params
  const [session] = await sql`select * from sessions where id = ${id} and user_id = ${request.userId}`
  if (!session) return reply.status(404).send({ error: 'NOT_FOUND' })
  const ingredients = await sql`select * from ingredients where session_id = ${id}`
  const recipes = await sql`select * from recipes where session_id = ${id}`
  return { session: { ...session, ingredients, recipes } }
})

// Image upload — local dev: accept multipart base64 JSON body
app.post('/sessions/:id/images/upload-url', { preHandler: getUser }, async (request: any, reply) => {
  const { id: sessionId } = request.params
  const storageKey = `${sessionId}/${crypto.randomUUID()}`
  // For local dev, return a URL pointing back to this server
  return {
    upload_url: `http://${request.hostname}:${process.env.PORT ?? 3000}/upload/${storageKey}`,
    storage_key: storageKey,
    expires_in: 300,
  }
})

// Accept raw image upload
app.put('/upload/*', async (request: any, reply) => {
  const key = request.params['*']
  const { saveUpload } = await import('./services/storage.js')
  const body = request.body as Buffer
  await saveUpload(key, body)
  return reply.status(200).send()
})

app.post('/sessions/:id/images/confirm', { preHandler: getUser }, async (request: any, reply) => {
  const { id: sessionId } = request.params
  const { storage_key, size_bytes, mime_type } = request.body as any
  const [image] = await sql`
    insert into session_images (session_id, storage_key, size_bytes, mime_type)
    values (${sessionId}, ${storage_key}, ${size_bytes}, ${mime_type})
    returning *`
  await sql`update sessions set state = 'IMAGES_UPLOADED', updated_at = now() where id = ${sessionId}`
  return reply.status(201).send({ image })
})

// Extract ingredients
app.post('/sessions/:id/extract', { preHandler: getUser }, async (request: any, reply) => {
  const { id: sessionId } = request.params
  const userId = request.userId

  const locked = await acquireSessionLock(sessionId)
  if (!locked) return reply.status(409).send({ error: 'IN_PROGRESS' })

  try {
    await sql`update sessions set state = 'EXTRACTING', updated_at = now() where id = ${sessionId}`

    // Load images
    const images = await sql`
      select storage_key from session_images
      where session_id = ${sessionId} and deleted_at is null`

    // Read files as base64
    const base64s: string[] = []
    for (const img of images) {
      try {
        const { getUploadPath } = await import('./services/storage.js')
        const buf = await readFile(await getUploadPath(img.storage_key))
        base64s.push(buf.toString('base64'))
      } catch {
        // skip unreadable files
      }
    }

    let ingredients: { name: string; confidence: number }[]
    let warnings: string[] = []

    if (base64s.length > 0 && process.env.ANTHROPIC_API_KEY !== 'YOUR_KEY_HERE') {
      const result = await extractFromImages(base64s)
      ingredients = result.ingredients
      warnings = result.warnings ?? []
    } else {
      // Demo mode: return sample ingredients
      ingredients = [
        { name: 'egg', confidence: 0.95 },
        { name: 'tomato', confidence: 0.91 },
        { name: 'cheese', confidence: 0.88 },
        { name: 'onion', confidence: 0.85 },
        { name: 'garlic', confidence: 0.82 },
        { name: 'butter', confidence: 0.79 },
        { name: 'milk', confidence: 0.76 },
        { name: 'pasta', confidence: 0.72 },
      ]
    }

    let savedIngredients = ingredients
    if (ingredients.length > 0) {
      savedIngredients = await sql`
        insert into ingredients ${sql(ingredients.map(i => ({
          session_id: sessionId,
          name: i.name,
          confidence: i.confidence,
          source: 'vision',
          is_active: true,
        })))} returning *
      `
    }

    await sql`update sessions set state = 'EXTRACTED', updated_at = now() where id = ${sessionId}`

    // Delete images (default: privacy on)
    const [prefs] = await sql`select photo_retention from user_preferences where user_id = ${userId}`
    if (!prefs?.photo_retention) {
      for (const img of images) await deleteUpload(img.storage_key)
      await sql`update session_images set deleted_at = now() where session_id = ${sessionId}`
    }

    return { ingredients: savedIngredients, warnings }
  } catch (err: any) {
    await sql`update sessions set state = 'FAILED', error_code = 'EXTRACTION_FAILED' where id = ${sessionId}`
    throw err
  } finally {
    await releaseSessionLock(sessionId)
  }
})

// Update ingredients
app.patch('/sessions/:id/ingredients', { preHandler: getUser }, async (request: any, reply) => {
  const { id: sessionId } = request.params
  const body = UpdateIngredientsSchema.parse(request.body)

  await sql`update ingredients set is_active = false where session_id = ${sessionId}`

  for (const ing of body.ingredients) {
    await sql`
      insert into ingredients (session_id, name, source, is_active)
      values (${sessionId}, ${ing.name}, 'manual', ${ing.is_active})
      on conflict do nothing`
  }

  const updated = await sql`select * from ingredients where session_id = ${sessionId}`
  return { ingredients: updated }
})

// Generate recipes
app.post('/sessions/:id/recipes', { preHandler: getUser }, async (request: any, reply) => {
  const { id: sessionId } = request.params
  const userId = request.userId
  const body = GenerateRecipesSchema.parse(request.body ?? {})

  const locked = await acquireSessionLock(sessionId)
  if (!locked) return reply.status(409).send({ error: 'IN_PROGRESS' })

  try {
    await sql`update sessions set state = 'GENERATING_RECIPES', updated_at = now() where id = ${sessionId}`

    const ingredients = await sql`
      select name from ingredients where session_id = ${sessionId} and is_active = true`
    const names = ingredients.map((i: any) => i.name)

    // Merge preferences
    const [userPrefs] = await sql`select * from user_preferences where user_id = ${userId}`
    const prefs = body.preferences ?? (userPrefs ? {
      cook_time_max: userPrefs.cook_time_max,
      diet_tags: userPrefs.diet_tags,
      allergy_tags: userPrefs.allergy_tags,
      cuisine_tags: userPrefs.cuisine_tags,
      equipment_tags: userPrefs.equipment_tags,
      servings: userPrefs.servings,
    } : undefined)

    const { recipes } = await generateRecipesAI(names, prefs)

    const saved = []
    for (const r of recipes) {
      const [rec] = await sql`
        insert into recipes (session_id, title, description, cook_time_minutes, difficulty, servings, usage_ratio, uses, missing, steps, source)
        values (${sessionId}, ${r.title}, ${r.description}, ${r.cook_time_minutes}, ${r.difficulty}, ${r.servings ?? 2}, ${r.usage_ratio}, ${sql.array(r.uses)}, ${sql.array(r.missing)}, ${sql.json(r.steps)}, ${(r as any).source ?? 'ai'})
        returning *`
      saved.push(rec)
    }

    await sql`update sessions set state = 'RECIPES_READY', updated_at = now() where id = ${sessionId}`
    return { recipes: saved }
  } catch (err: any) {
    await sql`update sessions set state = 'FAILED', error_code = 'GENERATION_FAILED' where id = ${sessionId}`
    throw err
  } finally {
    await releaseSessionLock(sessionId)
  }
})

// ── Recipes ───────────────────────────────────────────────────────────────
app.get('/recipes/:id', { preHandler: getUser }, async (request: any, reply) => {
  const { id } = request.params
  const [recipe] = await sql`select * from recipes where id = ${id}`
  if (!recipe) return reply.status(404).send({ error: 'NOT_FOUND' })
  return { recipe }
})

app.post('/recipes/:id/save', { preHandler: getUser }, async (request: any, reply) => {
  const { id } = request.params
  await sql`
    insert into saved_recipes (user_id, recipe_id) values (${request.userId}, ${id})
    on conflict (user_id, recipe_id) do nothing`
  return reply.status(201).send({ saved: true })
})

app.delete('/recipes/:id/save', { preHandler: getUser }, async (request: any, reply) => {
  const { id } = request.params
  await sql`delete from saved_recipes where user_id = ${request.userId} and recipe_id = ${id}`
  return { saved: false }
})

// ── Users ─────────────────────────────────────────────────────────────────
app.get('/users/me/saved', { preHandler: getUser }, async (request: any) => {
  const rows = await sql`
    select sr.*, row_to_json(r.*) as recipe
    from saved_recipes sr
    join recipes r on r.id = sr.recipe_id
    where sr.user_id = ${request.userId}
    order by sr.saved_at desc`
  return { saved: rows }
})

app.get('/users/me/history', { preHandler: getUser }, async (request: any) => {
  const sessions = await sql`
    select s.id, s.state, s.created_at,
      (select json_agg(i) from ingredients i where i.session_id = s.id and i.is_active = true) as ingredients,
      (select json_agg(r) from recipes r where r.session_id = s.id) as recipes
    from sessions s
    where s.user_id = ${request.userId} and s.state = 'RECIPES_READY'
    order by s.created_at desc
    limit 50`
  return { sessions }
})

app.get('/users/me/preferences', { preHandler: getUser }, async (request: any) => {
  const [prefs] = await sql`select * from user_preferences where user_id = ${request.userId}`
  return { preferences: prefs ?? null }
})

app.put('/users/me/preferences', { preHandler: getUser }, async (request: any, reply) => {
  const body = PreferencesSchema.parse(request.body)
  const [prefs] = await sql`
    insert into user_preferences (user_id, cook_time_max, diet_tags, allergy_tags, cuisine_tags, equipment_tags, servings)
    values (${request.userId}, ${body.cook_time_max ?? null}, ${sql.array(body.diet_tags ?? [])}, ${sql.array(body.allergy_tags ?? [])}, ${sql.array(body.cuisine_tags ?? [])}, ${sql.array(body.equipment_tags ?? [])}, ${body.servings ?? 2})
    on conflict (user_id) do update set
      cook_time_max = excluded.cook_time_max,
      diet_tags = excluded.diet_tags,
      allergy_tags = excluded.allergy_tags,
      cuisine_tags = excluded.cuisine_tags,
      equipment_tags = excluded.equipment_tags,
      servings = excluded.servings,
      updated_at = now()
    returning *`
  return { preferences: prefs }
})

app.delete('/users/me', { preHandler: getUser }, async (request: any, reply) => {
  await sql`delete from users where id = ${request.userId}`
  return reply.status(204).send()
})

// ── Analytics (fire and forget) ───────────────────────────────────────────
app.post('/analytics/events', { preHandler: getUser }, async (request: any, reply) => {
  const body = BatchAnalyticsSchema.parse(request.body)
  // Insert async, don't await
  sql`insert into analytics_events ${sql(body.events.map(e => ({
    user_id: request.userId,
    session_id: e.session_id ?? null,
    event_name: e.event_name,
    properties: e.properties ?? {},
    occurred_at: e.occurred_at ?? new Date().toISOString(),
  })))}`.catch(() => {})
  return reply.status(202).send({ accepted: body.events.length })
})

// ── Start ─────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3000)
try {
  await redis.connect()
} catch {
  app.log.warn('Redis connection failed — session locks disabled')
}

await app.listen({ port, host: '0.0.0.0' })
console.log(`\n🚀 Local API running at http://localhost:${port}\n`)
