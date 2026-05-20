// src/index.ts
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { jwt } from '@elysiajs/jwt'
import { cors } from '@elysiajs/cors'
import { loanRoutes } from './routes/loanRoutes'
import { errorHandler } from './middleware/errorHandler'

const app = new Elysia()
  .use(swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'Borrowing Service API',
        version: '1.0.0'
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }))
  .use(cors())
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key'
  }))
  .use(errorHandler)
  .use(loanRoutes)
  .listen(3003)

console.log(`🦊 User service is running at ${app.server?.hostname}:${app.server?.port}`)