import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const owners = searchParams.get('owners')?.split(',').filter(Boolean) || []
    const properties = searchParams.get('properties')?.split(',').filter(Boolean) || []
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('expenses')
      .select(`
        *,
        property:properties!inner(id, name, address),
        expense_type:expense_types!inner(id, name),
        created_by_user:users!expenses_created_by_fkey(id, first_name, last_name)
      `)
      .order('date', { ascending: false })

    if (user.role === 'owner') {
      const { data: userProperties } = await supabaseAdmin
        .from('ownerships')
        .select('property_id')
        .eq('user_id', user.id)

      if (userProperties && userProperties.length > 0) {
        const propertyIds = userProperties.map(p => p.property_id)
        query = query.in('property_id', propertyIds)
      } else {
        return NextResponse.json({ expenses: [], total: 0 })
      }
    }

    if (owners.length > 0) {
      const { data: ownerProperties } = await supabaseAdmin
        .from('ownerships')
        .select('property_id')
        .in('user_id', owners)

      if (ownerProperties && ownerProperties.length > 0) {
        const propertyIds = ownerProperties.map(p => p.property_id)
        query = query.in('property_id', propertyIds)
      } else {
        return NextResponse.json({ expenses: [], total: 0 })
      }
    }

    if (properties.length > 0) {
      query = query.in('property_id', properties)
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('date', dateTo)
    }

    const { data: expenses, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }

    const { count } = await query.select('*', { count: 'exact', head: true })

    return NextResponse.json({
      expenses: expenses || [],
      total: count || 0,
      page,
      limit
    })

  } catch (error) {
    console.error('Error in expenses GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { property_id, type_id, date, amount_usd, comment } = body

    if (!property_id || !type_id || !date || !amount_usd) {
      return NextResponse.json({ 
        error: 'Missing required fields: property_id, type_id, date, amount_usd' 
      }, { status: 400 })
    }

    if (amount_usd <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('id', property_id)
      .single()

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const { data: expenseType } = await supabaseAdmin
      .from('expense_types')
      .select('id')
      .eq('id', type_id)
      .single()

    if (!expenseType) {
      return NextResponse.json({ error: 'Expense type not found' }, { status: 404 })
    }

    const { data: expense, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        property_id,
        type_id,
        date,
        amount_usd: parseFloat(amount_usd),
        comment: comment || null,
        created_by: user.id
      })
      .select(`
        *,
        property:properties!inner(id, name, address),
        expense_type:expense_types!inner(id, name),
        created_by_user:users!expenses_created_by_fkey(id, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error('Error creating expense:', error)
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
    }

    return NextResponse.json({ expense })

  } catch (error) {
    console.error('Error in expenses POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
