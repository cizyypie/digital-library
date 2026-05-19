export const authMiddleware = async ({ request, set }: any) => {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    set.status = 401
    return { error: 'Unauthorized - No token provided' }
  }

  try {
    const token = authHeader.split(' ')[1]
    
    // Ensure we're preserving the authorization header
    if (!request.headers.has('authorization')) {
      request.headers.set('authorization', authHeader)
    }
    
    return // Just continue to the next handler
  } catch (error) {
    set.status = 401
    return { error: 'Invalid token' }
  }
}