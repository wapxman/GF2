import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { UpdatePropertyRequest } from '@/types/property'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { name, address, area_sqm, rent_rate_usd, owners }: UpdatePropertyRequest = await request.json()

    if (owners && owners.length > 0) {
      const totalShare = owners.reduce((sum, owner) => sum + owner.share_pct, 0)
      if (Math.abs(totalShare - 100) > 0.01) {
        return NextResponse.json(
          { error: 'Сумма долей владения должна составлять 100%' },
          { status: 400 }
        )
      }

      const ownerIds = owners.map(o => o.user_id)
      const { data: existingUsers, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('id', ownerIds)

      if (usersError || !existingUsers || existingUsers.length !== ownerIds.length) {
        return NextResponse.json(
          { error: 'Один или несколько владельцев не найдены' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (area_sqm !== undefined) updateData.area_sqm = area_sqm
    if (rent_rate_usd !== undefined) updateData.rent_rate_usd = rent_rate_usd

    if (Object.keys(updateData).length > 0) {
      const { error: propertyError } = await supabaseAdmin
        .from('properties')
        .update(updateData)
        .eq('id', params.id)

      if (propertyError) {
        return NextResponse.json(
          { error: 'Ошибка при обновлении объекта недвижимости' },
          { status: 500 }
        )
      }
    }

    if (owners && owners.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('ownerships')
        .delete()
        .eq('property_id', params.id)

      if (deleteError) {
        return NextResponse.json(
          { error: 'Ошибка при обновлении долей владения' },
          { status: 500 }
        )
      }

      const ownerships = owners.map(owner => ({
        property_id: params.id,
        user_id: owner.user_id,
        share_pct: owner.share_pct
      }))

      const { error: insertError } = await supabaseAdmin
        .from('ownerships')
        .insert(ownerships)

      if (insertError) {
        return NextResponse.json(
          { error: 'Ошибка при создании новых долей владения' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Объект недвижимости успешно обновлен'
    })
  } catch (error) {
    console.error('Update property error:', error)
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

    const { error } = await supabaseAdmin
      .from('properties')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: 'Ошибка при удалении объекта недвижимости' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Объект недвижимости успешно удален'
    })
  } catch (error) {
    console.error('Delete property error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
