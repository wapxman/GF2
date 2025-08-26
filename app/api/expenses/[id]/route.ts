import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { property_id, type_id, date, amount_usd, comment } = body

    const { data: existingExpense } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (property_id !== undefined) {
      const { data: property } = await supabaseAdmin
        .from('properties')
        .select('id')
        .eq('id', property_id)
        .single()

      if (!property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 })
      }
      updateData.property_id = property_id
    }

    if (type_id !== undefined) {
      const { data: expenseType } = await supabaseAdmin
        .from('expense_types')
        .select('id')
        .eq('id', type_id)
        .single()

      if (!expenseType) {
        return NextResponse.json({ error: 'Expense type not found' }, { status: 404 })
      }
      updateData.type_id = type_id
    }

    if (date !== undefined) {
      updateData.date = date
    }

    if (amount_usd !== undefined) {
      if (amount_usd <= 0) {
        return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
      }
      updateData.amount_usd = parseFloat(amount_usd)
    }

    if (comment !== undefined) {
      updateData.comment = comment || null
    }

    const { data: expense, error } = await supabaseAdmin
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        property:properties!inner(id, name, address),
        expense_type:expense_types!inner(id, name),
        created_by_user:users!expenses_created_by_fkey(id, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error('Error updating expense:', error)
      return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
    }

    return NextResponse.json({ expense })

  } catch (error) {
    console.error('Error in expense PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete expenses' }, { status: 403 })
    }

    const { id } = params

    const { data: existingExpense } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting expense:', error)
      return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Expense deleted successfully' })

  } catch (error) {
    console.error('Error in expense DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
