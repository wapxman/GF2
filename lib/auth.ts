import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { User } from '@/types/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      login: user.login,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function getUserFromRequest(request: NextRequest): any {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  
  return verifyToken(token)
}

export function createAuthCookie(token: string): string {
  return `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
}

export function clearAuthCookie(): string {
  return `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`
}
