'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from '@/types/auth'
import { Property } from '@/types/property'
import { Income, IncomeStats } from '@/types/income'
import { DollarSign, TrendingUp, Calendar, Building } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

const MONTHS = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
]

interface IncomeMatrix {
  [propertyId: string]: {
    [month: number]: number
  }
}

export default function IncomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [income, setIncome] = useState<Income[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<IncomeStats>({
    yearlyTotal: 0,
    monthlyTotal: 0,
    averageMonthly: 0,
    propertiesWithIncome: 0
  })
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    owners: [] as string[],
    properties: [] as string[]
  })
  const [incomeMatrix, setIncomeMatrix] = useState<IncomeMatrix>({})
  const [pendingUpdates, setPendingUpdates] = useState<{[key: string]: number}>({})

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/me')
      if (!response.ok) {
        return
      }
      
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      const params = new URLSearchParams({
        year: filters.year.toString(),
        ...(filters.owners.length > 0 && { owners: filters.owners.join(',') }),
        ...(filters.properties.length > 0 && { properties: filters.properties.join(',') })
      })

      const [incomeRes, propertiesRes, usersRes] = await Promise.all([
        fetch(`/api/income?${params}`),
        fetch('/api/properties'),
        fetch('/api/users')
      ])

      if (incomeRes.ok) {
        const incomeData = await incomeRes.json()
        setIncome(incomeData.income)
        setStats(incomeData.stats)

        const matrix: IncomeMatrix = {}
        incomeData.income.forEach((item: Income) => {
          if (!matrix[item.property_id]) {
            matrix[item.property_id] = {}
          }
          matrix[item.property_id][item.month] = item.amount_usd
        })
        setIncomeMatrix(matrix)
      }

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData.properties)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }, [user, filters])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  useEffect(() => {
    setLoading(false)
  }, [])

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const debouncedSave = useCallback(
    debounce(async (updates: {[key: string]: number}) => {
      if (Object.keys(updates).length === 0) return

      const updateArray = Object.entries(updates).map(([key, amount]) => {
        const [propertyId, month] = key.split('-')
        return {
          property_id: propertyId,
          month: parseInt(month),
          year: filters.year,
          amount_usd: amount
        }
      })

      try {
        const response = await fetch('/api/income', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: updateArray })
        })

        if (response.ok) {
          setPendingUpdates({})
          fetchData()
        }
      } catch (error) {
        console.error('Error saving income:', error)
      }
    }, 1000),
    [filters.year, fetchData]
  )

  const handleIncomeChange = (propertyId: string, month: number, value: string) => {
    const amount = parseFloat(value) || 0
    const key = `${propertyId}-${month}`
    
    setIncomeMatrix(prev => ({
      ...prev,
      [propertyId]: {
        ...prev[propertyId],
        [month]: amount
      }
    }))

    const newPendingUpdates = {
      ...pendingUpdates,
      [key]: amount
    }
    setPendingUpdates(newPendingUpdates)
    debouncedSave(newPendingUpdates)
  }

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      owners: [],
      properties: []
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout activeSection="income">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Доход</h1>
              <p className="text-gray-600">Управление доходами недвижимости</p>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Годовая сумма</p>
                  <p className="text-xl font-bold text-green-600">
                    ${stats.yearlyTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">За текущий месяц</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${stats.monthlyTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Средний доход/месяц</p>
                  <p className="text-xl font-bold text-purple-600">
                    ${stats.averageMonthly.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Объектов с доходом</p>
                  <p className="text-xl font-bold text-orange-600">
                    {stats.propertiesWithIncome}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Фильтры</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="year">Год</Label>
                <Select
                  value={filters.year.toString()}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, year: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="owners">Владельцы</Label>
                <Select
                  value={filters.owners.length > 0 ? filters.owners[0] : 'all'}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    owners: value === 'all' ? [] : [value] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите владельцев" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все владельцы</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="properties">Объекты</Label>
                <Select
                  value={filters.properties.length > 0 ? filters.properties[0] : 'all'}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    properties: value === 'all' ? [] : [value] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите объекты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все объекты</SelectItem>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters}>
                  Очистить фильтры
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Доходы по месяцам ({filters.year})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-gray-900 min-w-[200px]">
                      Объект
                    </th>
                    {MONTHS.map((month, index) => (
                      <th key={index} className="text-center p-2 font-medium text-gray-900 min-w-[100px]">
                        {month}
                      </th>
                    ))}
                    <th className="text-center p-2 font-medium text-gray-900 min-w-[100px]">
                      Итого
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map(property => {
                    const propertyIncome = incomeMatrix[property.id] || {}
                    const yearlyTotal = Object.values(propertyIncome).reduce((sum, amount) => sum + amount, 0)
                    
                    return (
                      <tr key={property.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium text-gray-900">{property.name}</div>
                            <div className="text-sm text-gray-500">{property.address}</div>
                          </div>
                        </td>
                        {MONTHS.map((_, monthIndex) => {
                          const month = monthIndex + 1
                          const value = propertyIncome[month] || 0
                          const key = `${property.id}-${month}`
                          const isPending = key in pendingUpdates
                          
                          return (
                            <td key={month} className="p-1">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={value || ''}
                                onChange={(e) => handleIncomeChange(property.id, month, e.target.value)}
                                className={`text-center border-0 bg-transparent hover:bg-white focus:bg-white ${
                                  isPending ? 'bg-yellow-50' : ''
                                }`}
                                placeholder="0"
                              />
                            </td>
                          )
                        })}
                        <td className="p-2 text-center font-medium">
                          ${yearlyTotal.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-gray-50">
                    <td className="p-2 font-bold text-gray-900">Итого по месяцам</td>
                    {MONTHS.map((_, monthIndex) => {
                      const month = monthIndex + 1
                      const monthTotal = properties.reduce((sum, property) => {
                        const propertyIncome = incomeMatrix[property.id] || {}
                        return sum + (propertyIncome[month] || 0)
                      }, 0)
                      
                      return (
                        <td key={month} className="p-2 text-center font-bold text-gray-900">
                          ${monthTotal.toLocaleString()}
                        </td>
                      )
                    })}
                    <td className="p-2 text-center font-bold text-gray-900">
                      ${stats.yearlyTotal.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
