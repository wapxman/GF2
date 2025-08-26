import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, login, first_name, last_name, phone, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Ошибка при получении пользователей' },
        { status: 500 }
      )
    }

    const usersWithStatus = users.map(user => ({
      ...user,
      status: 'active'
    }))

    return NextResponse.json({
      success: true,
      users: usersWithStatus
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { first_name, last_name, login, password, phone, role } = await request.json()

    if (!first_name || !last_name || !login || !password || !role) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      )
    }

    if (!['admin', 'manager', 'owner'].includes(role)) {
      return NextResponse.json(
        { error: 'Недопустимая роль' },
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
      .select('id, login, first_name, last_name, phone, role, created_at')
      .single()

    if (insertError || !newUser) {
      return NextResponse.json(
        { error: 'Ошибка при создании пользователя' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        ...newUser,
        status: 'active'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
