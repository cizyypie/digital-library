// src/index.ts
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { jwt } from '@elysiajs/jwt'
import { userRoutes } from './routes/userRoutes'
import { errorHandler } from './middleware/errorHandler'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
  .use(swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'User Service API',
        version: '1.0.0'
      }
    }
  }))
  .use(cors())
  .use(jwt({  
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key'
  }))
  .use(errorHandler)
  .use(userRoutes)
  .listen(3001)

console.log(`🦊 User service is running at ${app.server?.hostname}:${app.server?.port}`)