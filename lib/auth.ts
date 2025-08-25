import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { User } from '@/types/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const secret = new TextEncoder().encode(JWT_SECRET)

export async function generateToken(user: User): Promise<string> {
  return await new SignJWT({
    id: user.id,
    login: user.login,
    role: user.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<any> {
  try {
    console.log('verifyToken: JWT_SECRET available:', !!JWT_SECRET)
    console.log('verifyToken: JWT_SECRET length:', JWT_SECRET?.length)
    console.log('verifyToken: token length:', token?.length)
    const { payload } = await jwtVerify(token, secret)
    console.log('verifyToken: verification successful')
    return payload
  } catch (error) {
    console.log('verifyToken: verification failed:', (error as Error).message)
    return null
  }
}

export async function getUserFromRequest(request: NextRequest): Promise<any> {
  const token = request.cookies.get('auth-token')?.value
  console.log('getUserFromRequest: token found:', !!token)
  console.log('getUserFromRequest: all cookies:', request.cookies.getAll().map(c => c.name))
  
  if (!token) {
    console.log('getUserFromRequest: No token found')
    return null
  }
  
  const decoded = await verifyToken(token)
  console.log('getUserFromRequest: token decoded:', !!decoded)
  return decoded
}

export function createAuthCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const secureFlag = isProduction ? 'Secure; ' : ''
  return `auth-token=${token}; HttpOnly; ${secureFlag}SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
}

export function clearAuthCookie(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const secureFlag = isProduction ? 'Secure; ' : ''
  return `auth-token=; HttpOnly; ${secureFlag}SameSite=Strict; Max-Age=0; Path=/`
}
