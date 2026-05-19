import { Elysia, t } from 'elysia'
import { CategoryService } from '../services/categoryService'
import { authMiddleware } from '../middleware/auth'

const categoryService = new CategoryService()

export const categoryRoutes = new Elysia({ prefix: '/api/categories' })
  .get('/', async () => {
    return await categoryService.getCategories()
  })

  .get('/:id', async ({ params }: any) => {
    return await categoryService.getCategoryById(Number(params.id))
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  .get('/:id/books', async ({ params }: any) => {
    return await categoryService.getBooksInCategory(Number(params.id))
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  .post('/', async ({ body }: any) => {
    return await categoryService.createCategory(body)
  }, {
    beforeHandle: [authMiddleware],
    body: t.Object({
      name: t.String(),
      description: t.Optional(t.String())
    })
  })

  .put('/:id', async ({ params, body }: any) => {
    return await categoryService.updateCategory(Number(params.id), body)
  }, {
    beforeHandle: [authMiddleware],
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      name: t.Optional(t.String()),
      description: t.Optional(t.String())
    })
  })

  .delete('/:id', async ({ params }: any) => {
    return await categoryService.deleteCategory(Number(params.id))
  }, {
    beforeHandle: [authMiddleware],
    params: t.Object({
      id: t.String()
    })
  })