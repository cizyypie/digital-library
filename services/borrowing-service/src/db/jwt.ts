import { verify as jwtVerify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const verify = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwtVerify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(err)
      } else {
        resolve(decoded)
      }
    })
  })
}