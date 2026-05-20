import { verify } from '../db/jwt'

export const authMiddleware = async ({ request, set }: any) => {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    set.status = 401
    return { error: 'Unauthorized - No token provided' }
  }

  try {
    const token = authHeader.split(' ')[1]
    const payload = await verify(token)
    return
  } catch (error) {
    set.status = 401
    return { error: 'Invalid token' }
  }
}