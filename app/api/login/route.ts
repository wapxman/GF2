import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateToken, createAuthCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

function getRateLimitKey(request: NextRequest): string {
  return request.ip || request.headers.get('x-forwarded-for') || 'unknown'
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(key)
  
  if (!attempts) {
    loginAttempts.set(key, { count: 1, lastAttempt: now })
    return false
  }

  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(key, { count: 1, lastAttempt: now })
    return false
  }

  if (attempts.count >= 5) {
    return true
  }

  attempts.count++
  attempts.lastAttempt = now
  return false
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request)
    
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
        { status: 429 }
      )
    }

    const { login, password } = await request.json()

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны для заполнения' },
        { status: 400 }
      )
    }

    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('login', login)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    loginAttempts.delete(rateLimitKey)

    const token = generateToken(user)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        login: user.login,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role
      }
    })

    response.headers.set('Set-Cookie', createAuthCookie(token))
    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
