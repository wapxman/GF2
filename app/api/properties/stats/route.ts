import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PropertyStats } from '@/types/property'

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
          share_pct
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
      console.error('Error fetching properties stats:', error)
      return NextResponse.json(
        { error: 'Ошибка при получении статистики' },
        { status: 500 }
      )
    }

    let stats: PropertyStats

    if (user.role === 'admin' || user.role === 'manager') {
      const uniqueProperties = new Map()
      propertiesData?.forEach(property => {
        if (!uniqueProperties.has(property.id)) {
          uniqueProperties.set(property.id, property)
        }
      })

      const properties = Array.from(uniqueProperties.values())
      const totalProperties = properties.length
      const totalArea = properties.reduce((sum, p) => sum + Number(p.area_sqm), 0)
      const expectedMonthlyIncome = properties.reduce((sum, p) => sum + Number(p.rent_rate_usd), 0)
      const averageRatePerSqm = totalArea > 0 ? expectedMonthlyIncome / totalArea : 0
      const multiOwnerProperties = properties.filter(p => {
        const ownerCount = propertiesData?.filter(pd => pd.id === p.id).length || 0
        return ownerCount > 1
      }).length

      stats = {
        total_properties: totalProperties,
        total_area: totalArea,
        expected_monthly_income: expectedMonthlyIncome,
        average_rate_per_sqm: averageRatePerSqm,
        multi_owner_properties: multiOwnerProperties
      }
    } else {
      const userProperties = propertiesData?.filter(p => 
        p.ownerships.some((o: any) => o.user_id === user.id)
      ) || []

      const uniqueProperties = new Map()
      userProperties.forEach(property => {
        if (!uniqueProperties.has(property.id)) {
          uniqueProperties.set(property.id, property)
        }
      })

      const properties = Array.from(uniqueProperties.values())
      const totalProperties = properties.length
      
      let totalUserArea = 0
      let expectedUserIncome = 0
      
      properties.forEach(property => {
        const userOwnership = property.ownerships.find((o: any) => o.user_id === user.id)
        if (userOwnership) {
          const sharePercent = Number(userOwnership.share_pct) / 100
          totalUserArea += Number(property.area_sqm) * sharePercent
          expectedUserIncome += Number(property.rent_rate_usd) * sharePercent
        }
      })

      const averageRatePerSqm = totalUserArea > 0 ? expectedUserIncome / totalUserArea : 0
      const multiOwnerProperties = properties.filter(p => {
        const ownerCount = propertiesData?.filter(pd => pd.id === p.id).length || 0
        return ownerCount > 1
      }).length

      stats = {
        total_properties: totalProperties,
        total_area: totalUserArea,
        expected_monthly_income: expectedUserIncome,
        average_rate_per_sqm: averageRatePerSqm,
        multi_owner_properties: multiOwnerProperties
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Properties stats API error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
