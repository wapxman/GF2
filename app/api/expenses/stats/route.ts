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

    let query = supabaseAdmin
      .from('expenses')
      .select('amount_usd, date, property_id')

    if (user.role === 'owner') {
      const { data: userProperties } = await supabaseAdmin
        .from('ownerships')
        .select('property_id')
        .eq('user_id', user.id)

      if (userProperties && userProperties.length > 0) {
        const propertyIds = userProperties.map(p => p.property_id)
        query = query.in('property_id', propertyIds)
      } else {
        return NextResponse.json({
          totalAmount: 0,
          currentMonthAmount: 0,
          currentYearAmount: 0,
          periodAmount: 0
        })
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
        return NextResponse.json({
          totalAmount: 0,
          currentMonthAmount: 0,
          currentYearAmount: 0,
          periodAmount: 0
        })
      }
    }

    if (properties.length > 0) {
      query = query.in('property_id', properties)
    }

    const { data: allExpenses, error } = await query

    if (error) {
      console.error('Error fetching expenses for stats:', error)
      return NextResponse.json({ error: 'Failed to fetch expenses statistics' }, { status: 500 })
    }

    const expenses = allExpenses || []
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount_usd), 0)

    const currentMonthAmount = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() === currentMonth
      })
      .reduce((sum, expense) => sum + parseFloat(expense.amount_usd), 0)

    const currentYearAmount = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getFullYear() === currentYear
      })
      .reduce((sum, expense) => sum + parseFloat(expense.amount_usd), 0)

    let periodAmount = totalAmount
    if (dateFrom || dateTo) {
      periodAmount = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date)
          if (dateFrom && expenseDate < new Date(dateFrom)) return false
          if (dateTo && expenseDate > new Date(dateTo)) return false
          return true
        })
        .reduce((sum, expense) => sum + parseFloat(expense.amount_usd), 0)
    }

    return NextResponse.json({
      totalAmount: Math.round(totalAmount * 100) / 100,
      currentMonthAmount: Math.round(currentMonthAmount * 100) / 100,
      currentYearAmount: Math.round(currentYearAmount * 100) / 100,
      periodAmount: Math.round(periodAmount * 100) / 100
    })

  } catch (error) {
    console.error('Error in expenses stats GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
