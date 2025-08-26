'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { User } from '@/types/auth'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

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

interface Property {
  id: string
  name: string
  address: string
  area_sqm: number
  rent_rate_usd: number
}

interface UserOption {
  id: string
  first_name: string
  last_name: string
  login: string
}

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

export default function FinancePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FinanceSummaryItem[]>([])
  const [stats, setStats] = useState<FinanceStats>({
    total_expected: 0,
    total_actual_income: 0,
    total_expenses: 0,
    total_delta: 0,
    overall_plan_percentage: 0
  })
  const [properties, setProperties] = useState<Property[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    months: [] as number[],
    owners: [] as string[],
    properties: [] as string[]
  })

  const router = useRouter()

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/me')
      if (!response.ok) {
        router.push('/login')
        return
      }
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Error fetching user:', error)
      router.push('/login')
    }
  }

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchFinanceData = async () => {
    try {
      const params = new URLSearchParams({
        year: filters.year.toString(),
        ...(filters.months.length > 0 && { months: filters.months.join(',') }),
        ...(filters.owners.length > 0 && { owners: filters.owners.join(',') }),
        ...(filters.properties.length > 0 && { properties: filters.properties.join(',') })
      })

      const response = await fetch(`/api/finance/summary?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary || [])
        setStats(data.stats || {
          total_expected: 0,
          total_actual_income: 0,
          total_expenses: 0,
          total_delta: 0,
          overall_plan_percentage: 0
        })
      }
    } catch (error) {
      console.error('Error fetching finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProperties()
      fetchUsers()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchFinanceData()
    }
  }, [user, filters])

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      months: [],
      owners: [],
      properties: []
    })
  }

  const chartData = summary.map(item => ({
    name: item.property_name.length > 15 ? item.property_name.substring(0, 15) + '...' : item.property_name,
    expected: item.expected_income,
    actual: item.actual_income,
    expenses: item.actual_expenses,
    profit: item.delta
  }))

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад к дашборду</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
              <p className="text-gray-600">Финансовая сводка по недвижимости</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Ожидаемый доход</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${stats.total_expected.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Фактический доход</p>
                  <p className="text-xl font-bold text-green-600">
                    ${stats.total_actual_income.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Расходы</p>
                  <p className="text-xl font-bold text-red-600">
                    ${stats.total_expenses.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded-full ${stats.total_delta >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="text-sm text-gray-600">Прибыль/Убыток</p>
                  <p className={`text-xl font-bold ${stats.total_delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${stats.total_delta.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className={`w-5 h-5 ${stats.overall_plan_percentage >= 100 ? 'text-green-600' : stats.overall_plan_percentage >= 80 ? 'text-yellow-600' : 'text-red-600'}`} />
                <div>
                  <p className="text-sm text-gray-600">% от плана</p>
                  <p className={`text-xl font-bold ${stats.overall_plan_percentage >= 100 ? 'text-green-600' : stats.overall_plan_percentage >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {stats.overall_plan_percentage.toFixed(1)}%
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="year">Год *</Label>
                <Select
                  value={filters.year.toString()}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, year: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i + 1).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="months">Месяцы</Label>
                <Select
                  value={filters.months.length > 0 ? filters.months[0].toString() : 'all'}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    months: value === 'all' ? [] : [parseInt(value)] 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все месяцы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все месяцы</SelectItem>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
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
                    <SelectValue placeholder="Все владельцы" />
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
                    <SelectValue placeholder="Все объекты" />
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

        {summary.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Доходы и расходы по объектам</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="expected" fill="#3B82F6" name="Ожидаемый доход" />
                    <Bar dataKey="actual" fill="#10B981" name="Фактический доход" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Расходы" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Прибыль по объектам</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="profit" stroke="#8B5CF6" strokeWidth={2} name="Прибыль" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Детальная сводка</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Нет данных для отображения</p>
                <p className="text-sm text-gray-400 mt-2">Попробуйте изменить фильтры или добавить данные о доходах и расходах</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Объект</TableHead>
                      <TableHead className="text-right">Ожидаемый доход</TableHead>
                      <TableHead className="text-right">Фактический доход</TableHead>
                      <TableHead className="text-right">Расходы</TableHead>
                      <TableHead className="text-right">Δ (Доход-Расходы)</TableHead>
                      <TableHead className="text-right">% от плана</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.map((item) => (
                      <TableRow key={item.property_id}>
                        <TableCell className="font-medium">{item.property_name}</TableCell>
                        <TableCell className="text-right text-blue-600">
                          ${item.expected_income.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ${item.actual_income.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ${item.actual_expenses.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${item.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${item.delta.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          item.plan_percentage >= 100 ? 'text-green-600' : 
                          item.plan_percentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {item.plan_percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 bg-gray-50">
                      <TableCell className="font-bold">Итого</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        ${stats.total_expected.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ${stats.total_actual_income.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        ${stats.total_expenses.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${stats.total_delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${stats.total_delta.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        stats.overall_plan_percentage >= 100 ? 'text-green-600' : 
                        stats.overall_plan_percentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {stats.overall_plan_percentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
