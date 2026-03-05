import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { authRoutes } from './routes/auth.js'
import { sessionRoutes } from './routes/sessions.js'
import { recipeRoutes } from './routes/recipes.js'
import { userRoutes } from './routes/users.js'
import { analyticsRoutes } from './routes/analytics.js'

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
  },
  genReqId: () => crypto.randomUUID(),
})

await app.register(helmet)
await app.register(cors, {
  origin: true,
})

// Health check
app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

// Routes
await app.register(authRoutes, { prefix: '/auth' })
await app.register(sessionRoutes, { prefix: '/sessions' })
await app.register(recipeRoutes, { prefix: '/recipes' })
await app.register(userRoutes, { prefix: '/users' })
await app.register(analyticsRoutes, { prefix: '/analytics' })

// Global error handler
app.setErrorHandler((error: any, request, reply) => {
  request.log.error({ err: error }, 'Unhandled error')

  if (error.validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: error.validation,
    })
  }

  const statusCode = error.statusCode ?? 500
  return reply.status(statusCode).send({
    error: error.code ?? 'INTERNAL_ERROR',
    message: statusCode === 500 ? 'Internal server error' : error.message,
  })
})

const port = Number(process.env.PORT ?? 3000)
await app.listen({ port, host: '0.0.0.0' })
console.log(`API running on port ${port}`)
