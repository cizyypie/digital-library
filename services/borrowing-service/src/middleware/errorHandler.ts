import { Elysia } from 'elysia'

export const errorHandler = new Elysia()
  .onError(({ code, error, set }: any) => {
    switch (code) {
      case 'NOT_FOUND':
        set.status = 404
        return { error: 'Not Found' }
      case 'VALIDATION':
        set.status = 400
        return { error: 'Validation Error', details: error.message }
      default:
        set.status = 500
        return { error: 'Internal Server Error' }
    }
  })