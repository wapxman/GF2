import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: expenseTypes, error } = await supabaseAdmin
      .from('expense_types')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching expense types:', error)
      return NextResponse.json({ error: 'Failed to fetch expense types' }, { status: 500 })
    }

    return NextResponse.json({ expenseTypes: expenseTypes || [] })

  } catch (error) {
    console.error('Error in expense types GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create expense types' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data: existingType } = await supabaseAdmin
      .from('expense_types')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existingType) {
      return NextResponse.json({ error: 'Expense type with this name already exists' }, { status: 400 })
    }

    const { data: expenseType, error } = await supabaseAdmin
      .from('expense_types')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        is_system: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating expense type:', error)
      return NextResponse.json({ error: 'Failed to create expense type' }, { status: 500 })
    }

    return NextResponse.json({ expenseType })

  } catch (error) {
    console.error('Error in expense types POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
