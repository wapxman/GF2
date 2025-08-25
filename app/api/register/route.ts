import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateToken, createAuthCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { login, password, first_name, last_name, phone } = await request.json()

    if (!login || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      )
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('login')
      .eq('login', login)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким логином уже существует' },
        { status: 400 }
      )
    }

    const { count } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    const role = count === 0 ? 'admin' : 'owner'
    const hashedPassword = await bcrypt.hash(password, 10)

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          login,
          password_hash: hashedPassword,
          first_name,
          last_name,
          phone,
          role
        }
      ])
      .select()
      .single()

    if (insertError || !newUser) {
      return NextResponse.json(
        { error: 'Ошибка при создании пользователя' },
        { status: 500 }
      )
    }

    const token = await generateToken(newUser)
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: newUser.id,
        login: newUser.login,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        phone: newUser.phone,
        role: newUser.role
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
