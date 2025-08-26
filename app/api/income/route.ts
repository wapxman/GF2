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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const owners = searchParams.get('owners')?.split(',').filter(Boolean) || []
    const properties = searchParams.get('properties')?.split(',').filter(Boolean) || []

    let query = supabaseAdmin
      .from('income')
      .select(`
        *,
        property:properties!inner(id, name, address)
      `)
      .eq('year', year)
      .order('month', { ascending: true })

    if (user.role === 'owner') {
      const { data: userProperties } = await supabaseAdmin
        .from('ownerships')
        .select('property_id')
        .eq('user_id', user.id)

      if (userProperties && userProperties.length > 0) {
        const propertyIds = userProperties.map(p => p.property_id)
        query = query.in('property_id', propertyIds)
      } else {
        return NextResponse.json({ income: [], stats: { yearlyTotal: 0, monthlyTotal: 0, averageMonthly: 0, propertiesWithIncome: 0 } })
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
        return NextResponse.json({ income: [], stats: { yearlyTotal: 0, monthlyTotal: 0, averageMonthly: 0, propertiesWithIncome: 0 } })
      }
    }

    if (properties.length > 0) {
      query = query.in('property_id', properties)
    }

    const { data: income, error } = await query

    if (error) {
      console.error('Error fetching income:', error)
      return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 })
    }

    const yearlyTotal = income?.reduce((sum, item) => sum + item.amount_usd, 0) || 0
    const currentMonth = new Date().getMonth() + 1
    const monthlyTotal = income?.filter(item => item.month === currentMonth).reduce((sum, item) => sum + item.amount_usd, 0) || 0
    const averageMonthly = yearlyTotal / 12
    const propertiesWithIncome = new Set(income?.filter(item => item.amount_usd > 0).map(item => item.property_id)).size

    const stats = {
      yearlyTotal,
      monthlyTotal,
      averageMonthly,
      propertiesWithIncome
    }

    return NextResponse.json({
      income: income || [],
      stats
    })

  } catch (error) {
    console.error('Error in income GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { updates } = body

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates array is required' }, { status: 400 })
    }

    const results: any[] = []

    for (const update of updates) {
      const { property_id, month, year, amount_usd } = update

      if (!property_id || !month || !year || amount_usd === undefined) {
        continue
      }

      if (month < 1 || month > 12) {
        continue
      }

      const { data: property } = await supabaseAdmin
        .from('properties')
        .select('id')
        .eq('id', property_id)
        .single()

      if (!property) {
        continue
      }

      const { data: existingIncome } = await supabaseAdmin
        .from('income')
        .select('id')
        .eq('property_id', property_id)
        .eq('year', year)
        .eq('month', month)
        .single()

      if (existingIncome) {
        if (amount_usd === 0) {
          await supabaseAdmin
            .from('income')
            .delete()
            .eq('id', existingIncome.id)
        } else {
          const { data: updated } = await supabaseAdmin
            .from('income')
            .update({ amount_usd: parseFloat(amount_usd) })
            .eq('id', existingIncome.id)
            .select()
            .single()
          
          if (updated) results.push(updated)
        }
      } else if (amount_usd > 0) {
        const { data: created } = await supabaseAdmin
          .from('income')
          .insert({
            property_id,
            year,
            month,
            amount_usd: parseFloat(amount_usd)
          })
          .select()
          .single()
        
        if (created) results.push(created)
      }
    }

    return NextResponse.json({ 
      message: 'Income updated successfully',
      updated: results.length
    })

  } catch (error) {
    console.error('Error in income PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
