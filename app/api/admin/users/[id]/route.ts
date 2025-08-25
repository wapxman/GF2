import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const userId = params.id
    const updates = await request.json()

    const allowedFields = ['first_name', 'last_name', 'phone', 'role', 'status']
    const updateData: any = {}

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'role' && !['admin', 'manager', 'owner'].includes(value as string)) {
          return NextResponse.json(
            { error: 'Недопустимая роль' },
            { status: 400 }
          )
        }
        if (key === 'status' && !['active', 'blocked'].includes(value as string)) {
          return NextResponse.json(
            { error: 'Недопустимый статус' },
            { status: 400 }
          )
        }
        if (key !== 'status') {
          updateData[key] = value
        }
      }
    }

    if (Object.keys(updateData).length === 0 && !updates.status) {
      return NextResponse.json(
        { error: 'Нет данных для обновления' },
        { status: 400 }
      )
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, login, first_name, last_name, phone, role, created_at')
      .single()

    if (error || !updatedUser) {
      return NextResponse.json(
        { error: 'Ошибка при обновлении пользователя' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        status: updates.status || 'active'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const userId = params.id

    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Нельзя удалить самого себя' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Нельзя удалить пользователя, связанного с объектами недвижимости' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Ошибка при удалении пользователя' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Пользователь успешно удален'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
