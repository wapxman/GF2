import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.headers.set('Set-Cookie', clearAuthCookie())
  return response
}
