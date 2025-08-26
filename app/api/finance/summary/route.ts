import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

interface FinanceSummaryItem {
  property_id: string
  property_name: string
  expected_income: number
  actual_income: number
  actual_expenses: number
  delta: number
  plan_percentage: number
}

interface FinanceStats {
  total_expected: number
  total_actual_income: number
  total_expenses: number
  total_delta: number
  overall_plan_percentage: number
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const months = searchParams.get('months')?.split(',').map(m => parseInt(m)).filter(Boolean) || []
    const owners = searchParams.get('owners')?.split(',').filter(Boolean) || []
    const properties = searchParams.get('properties')?.split(',').filter(Boolean) || []

    let propertiesQuery = supabaseAdmin
      .from('properties')
      .select(`
        id,
        name,
        rent_rate_usd,
        ownerships!inner(
          user_id,
          share_pct
        )
      `)

    if (user.role === 'owner') {
      propertiesQuery = propertiesQuery.eq('ownerships.user_id', user.id)
    }

    if (owners.length > 0) {
      propertiesQuery = propertiesQuery.in('ownerships.user_id', owners)
    }

    if (properties.length > 0) {
      propertiesQuery = propertiesQuery.in('id', properties)
    }

    const { data: propertiesData, error: propertiesError } = await propertiesQuery

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    const propertiesMap = new Map()
    propertiesData?.forEach(property => {
      if (!propertiesMap.has(property.id)) {
        propertiesMap.set(property.id, {
          id: property.id,
          name: property.name,
          rent_rate_usd: property.rent_rate_usd,
          ownerships: []
        })
      }
      propertiesMap.get(property.id).ownerships.push({
        user_id: (property.ownerships as any).user_id,
        share_pct: (property.ownerships as any).share_pct
      })
    })

    const uniqueProperties = Array.from(propertiesMap.values())
    const propertyIds = uniqueProperties.map(p => p.id)

    if (propertyIds.length === 0) {
      return NextResponse.json({
        summary: [],
        stats: {
          total_expected: 0,
          total_actual_income: 0,
          total_expenses: 0,
          total_delta: 0,
          overall_plan_percentage: 0
        }
      })
    }

    let incomeQuery = supabaseAdmin
      .from('income')
      .select('property_id, amount_usd, month')
      .eq('year', year)
      .in('property_id', propertyIds)

    if (months.length > 0) {
      incomeQuery = incomeQuery.in('month', months)
    }

    const { data: incomeData, error: incomeError } = await incomeQuery

    if (incomeError) {
      console.error('Error fetching income:', incomeError)
      return NextResponse.json({ error: 'Failed to fetch income data' }, { status: 500 })
    }

    let expensesQuery = supabaseAdmin
      .from('expenses')
      .select('property_id, amount_usd, date')
      .in('property_id', propertyIds)

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    expensesQuery = expensesQuery.gte('date', startDate.toISOString()).lte('date', endDate.toISOString())

    if (months.length > 0) {
      const { data: allExpenses, error: expensesError } = await expensesQuery
      
      if (expensesError) {
        console.error('Error fetching expenses:', expensesError)
        return NextResponse.json({ error: 'Failed to fetch expenses data' }, { status: 500 })
      }

      const filteredExpenses = allExpenses?.filter(expense => {
        const expenseDate = new Date(expense.date)
        return months.includes(expenseDate.getMonth() + 1)
      }) || []

      var expensesData = filteredExpenses
    } else {
      const { data: allExpenses, error: expensesError } = await expensesQuery
      
      if (expensesError) {
        console.error('Error fetching expenses:', expensesError)
        return NextResponse.json({ error: 'Failed to fetch expenses data' }, { status: 500 })
      }

      var expensesData = allExpenses || []
    }

    const summary: FinanceSummaryItem[] = uniqueProperties.map(property => {
      const monthsToCalculate = months.length > 0 ? months.length : 12
      let expectedIncome = property.rent_rate_usd * monthsToCalculate

      if (user.role === 'owner') {
        const userOwnership = property.ownerships.find((o: any) => o.user_id === user.id)
        if (userOwnership) {
          expectedIncome = expectedIncome * (userOwnership.share_pct / 100)
        }
      }

      const propertyIncome = incomeData?.filter(income => income.property_id === property.id) || []
      let actualIncome = propertyIncome.reduce((sum, income) => sum + parseFloat(income.amount_usd), 0)

      if (user.role === 'owner') {
        const userOwnership = property.ownerships.find((o: any) => o.user_id === user.id)
        if (userOwnership) {
          actualIncome = actualIncome * (userOwnership.share_pct / 100)
        }
      }

      const propertyExpenses = expensesData?.filter(expense => expense.property_id === property.id) || []
      let actualExpenses = propertyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount_usd), 0)

      if (user.role === 'owner') {
        const userOwnership = property.ownerships.find((o: any) => o.user_id === user.id)
        if (userOwnership) {
          actualExpenses = actualExpenses * (userOwnership.share_pct / 100)
        }
      }

      const delta = actualIncome - actualExpenses
      const planPercentage = expectedIncome > 0 ? (actualIncome / expectedIncome) * 100 : 0

      return {
        property_id: property.id,
        property_name: property.name,
        expected_income: Math.round(expectedIncome * 100) / 100,
        actual_income: Math.round(actualIncome * 100) / 100,
        actual_expenses: Math.round(actualExpenses * 100) / 100,
        delta: Math.round(delta * 100) / 100,
        plan_percentage: Math.round(planPercentage * 100) / 100
      }
    })

    const stats: FinanceStats = {
      total_expected: Math.round(summary.reduce((sum, item) => sum + item.expected_income, 0) * 100) / 100,
      total_actual_income: Math.round(summary.reduce((sum, item) => sum + item.actual_income, 0) * 100) / 100,
      total_expenses: Math.round(summary.reduce((sum, item) => sum + item.actual_expenses, 0) * 100) / 100,
      total_delta: Math.round(summary.reduce((sum, item) => sum + item.delta, 0) * 100) / 100,
      overall_plan_percentage: 0
    }

    stats.overall_plan_percentage = stats.total_expected > 0 
      ? Math.round((stats.total_actual_income / stats.total_expected) * 100 * 100) / 100
      : 0

    return NextResponse.json({
      summary,
      stats
    })

  } catch (error) {
    console.error('Error in finance summary GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
