import { Elysia, t } from 'elysia'
import { BookService } from '../services/bookService'
import { authMiddleware } from '../middleware/auth'

const bookService = new BookService()

export const bookRoutes = new Elysia({ prefix: '/api/books' })
  .get('/', async ({ query }: any) => {
    const { page = 1, limit = 10, search } = query
    return await bookService.getBooks(Number(page), Number(limit), search)
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String())
    })
  })

  .get('/:id', async ({ params }: any) => {
    return await bookService.getBookById(Number(params.id))
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  .post('/', async ({ body }: any) => {
    const result = await bookService.createBook(body)
    return result[0] // Return full book object instead of array
  }, {
    beforeHandle: [authMiddleware],
    body: t.Object({
      title: t.String(),
      author: t.String(),
      isbn: t.String(),
      description: t.Optional(t.String()),
      categoryId: t.Optional(t.Number()),
      totalCopies: t.Number(),
      availableCopies: t.Number()
    })
  })

  .put('/:id', async ({ params, body }: any) => {
    return await bookService.updateBook(Number(params.id), body)
  }, {
    beforeHandle: [authMiddleware],
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      title: t.Optional(t.String()),
      author: t.Optional(t.String()),
      isbn: t.Optional(t.String()),
      description: t.Optional(t.String()),
      categoryId: t.Optional(t.Number()),
      totalCopies: t.Optional(t.Number()),
      availableCopies: t.Optional(t.Number())
    })
  })

  .delete('/:id', async ({ params }: any) => {
    return await bookService.deleteBook(Number(params.id))
  }, {
    beforeHandle: [authMiddleware],
    params: t.Object({
      id: t.String()
    })
  })