import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PropertyWithOwners, CreatePropertyRequest } from '@/types/property'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const owners = url.searchParams.get('owners')?.split(',').filter(Boolean) || []
    const properties = url.searchParams.get('properties')?.split(',').filter(Boolean) || []

    let query = supabaseAdmin
      .from('properties')
      .select(`
        *,
        ownerships!inner(
          user_id,
          share_pct,
          users!inner(
            id,
            first_name,
            last_name
          )
        )
      `)

    if (user.role === 'owner') {
      query = query.eq('ownerships.user_id', user.id)
    }

    if (owners.length > 0) {
      query = query.in('ownerships.user_id', owners)
    }

    if (properties.length > 0) {
      query = query.in('id', properties)
    }

    const { data: propertiesData, error } = await query

    if (error) {
      console.error('Error fetching properties:', error)
      return NextResponse.json(
        { error: 'Ошибка при получении объектов недвижимости' },
        { status: 500 }
      )
    }

    const transformedProperties: PropertyWithOwners[] = propertiesData?.map(property => ({
      id: property.id,
      name: property.name,
      address: property.address,
      area_sqm: property.area_sqm,
      rent_rate_usd: property.rent_rate_usd,
      created_at: property.created_at,
      updated_at: property.updated_at,
      owners: property.ownerships.map((ownership: any) => ({
        user_id: ownership.users.id,
        first_name: ownership.users.first_name,
        last_name: ownership.users.last_name,
        share_pct: ownership.share_pct
      }))
    })) || []

    return NextResponse.json({
      success: true,
      properties: transformedProperties
    })
  } catch (error) {
    console.error('Properties API error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { name, address, area_sqm, rent_rate_usd, owners }: CreatePropertyRequest = await request.json()

    if (!name || !address || !area_sqm || !rent_rate_usd || !owners || owners.length === 0) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      )
    }

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

    const { data: newProperty, error: propertyError } = await supabaseAdmin
      .from('properties')
      .insert([{
        name,
        address,
        area_sqm,
        rent_rate_usd
      }])
      .select()
      .single()

    if (propertyError || !newProperty) {
      return NextResponse.json(
        { error: 'Ошибка при создании объекта недвижимости' },
        { status: 500 }
      )
    }

    const ownerships = owners.map(owner => ({
      property_id: newProperty.id,
      user_id: owner.user_id,
      share_pct: owner.share_pct
    }))

    const { error: ownershipError } = await supabaseAdmin
      .from('ownerships')
      .insert(ownerships)

    if (ownershipError) {
      await supabaseAdmin
        .from('properties')
        .delete()
        .eq('id', newProperty.id)

      return NextResponse.json(
        { error: 'Ошибка при создании долей владения' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      property: newProperty
    })
  } catch (error) {
    console.error('Create property error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
