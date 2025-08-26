import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, login')
      .order('first_name', { ascending: true })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Ошибка при получении пользователей' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: users || []
    })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
