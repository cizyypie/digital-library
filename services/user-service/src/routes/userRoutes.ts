import { Elysia, t } from 'elysia'
import { UserService } from '../services/userServices'

const userService = new UserService()

export const userRoutes = new Elysia({ prefix: '/api/users' })
  .post('/register', async ({ body }) => {
    return await userService.createUser(body)
  }, {
    body: t.Object({
      username: t.String(),
      email: t.String(),
      password: t.String()
    })
  })
  
  // @ts-ignore
  .post('/login', async ({ body, jwt }) => {
    const user = await userService.loginUser(body.email, body.password)
    const token = await jwt.sign({ id: user.id })
    return { user, token }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })
  
  // @ts-ignore
  .get('/:id', async ({ params, jwt }) => {
    return await userService.getUserById(Number(params.id))
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  
  .put('/:id', async ({ params, body }) => {
    return await userService.updateUser(Number(params.id), body)
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      username: t.Optional(t.String()),
      email: t.Optional(t.String()),
      password: t.Optional(t.String())
    })
  })