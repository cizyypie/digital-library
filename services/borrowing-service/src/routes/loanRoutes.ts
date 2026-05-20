import { Elysia, t } from 'elysia'
import { LoanService } from '../services/loanService'
import { authMiddleware } from '../middleware/auth'

const loanService = new LoanService()

export const loanRoutes = new Elysia({ prefix: '/api/loans' })
  .get('/', async ({ query }) => {
    const { page = 1, limit = 10 } = query
    return await loanService.getAllLoans(Number(page), Number(limit),)
  }, {
    beforeHandle: [authMiddleware],
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
    })
  })

  .get('/:id', async ({ query, params }) => {
    const { status } = query
    const { id } = params
    return await loanService.getUserLoans(Number(params.id), status)
  }, {
    beforeHandle: [authMiddleware],
    query: t.Object({
      status: t.Optional(t.String())
    })
  })

  .post('/', async ({ body }) => {
    return await loanService.createLoan(body)
  }, {
    beforeHandle: [authMiddleware],
    body: t.Object({
      userId: t.Number(),
      bookId: t.Number()
    })
  })

  .put('/:id/return', async ({ params }) => {
    return await loanService.returnBook(Number(params.id))
  }, {
    beforeHandle: [authMiddleware],
    params: t.Object({
      id: t.String()
    })
  })

  .get('/overdue', async () => {
    return await loanService.checkOverdueLoans()
  }, {
    beforeHandle: [authMiddleware]
  })