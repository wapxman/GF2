'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { User } from '@/types/auth'
import { Property } from '@/types/property'
import { Expense, ExpenseType, ExpenseStats, CreateExpenseRequest } from '@/types/expense'
import { 
  TrendingDown, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Building,
  Users
} from 'lucide-react'

export default function ExpensesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [stats, setStats] = useState<ExpenseStats>({
    totalAmount: 0,
    currentMonthAmount: 0,
    currentYearAmount: 0,
    periodAmount: 0
  })
  
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [newExpense, setNewExpense] = useState<CreateExpenseRequest>({
    property_id: '',
    type_id: '',
    date: new Date().toISOString().split('T')[0],
    amount_usd: 0,
    comment: ''
  })
  const [isAddingNew, setIsAddingNew] = useState(false)

  const router = useRouter()

  useEffect(() => {
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
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  useEffect(() => {
    if (user) {
      fetchExpenses()
      fetchProperties()
      fetchUsers()
      fetchExpenseTypes()
      fetchStats()
    }
  }, [user, selectedOwners, selectedProperties, dateFrom, dateTo])

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedOwners.length > 0) params.append('owners', selectedOwners.join(','))
      if (selectedProperties.length > 0) params.append('properties', selectedProperties.join(','))
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/expenses?${params}`)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses || [])
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
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

  const fetchExpenseTypes = async () => {
    try {
      const response = await fetch('/api/expense-types')
      if (response.ok) {
        const data = await response.json()
        setExpenseTypes(data.expenseTypes || [])
      }
    } catch (error) {
      console.error('Error fetching expense types:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedOwners.length > 0) params.append('owners', selectedOwners.join(','))
      if (selectedProperties.length > 0) params.append('properties', selectedProperties.join(','))
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/expenses/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreateExpense = async () => {
    if (!newExpense.property_id || !newExpense.type_id || !newExpense.amount_usd) {
      return
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      })

      if (response.ok) {
        setNewExpense({
          property_id: '',
          type_id: '',
          date: new Date().toISOString().split('T')[0],
          amount_usd: 0,
          comment: ''
        })
        setIsAddingNew(false)
        fetchExpenses()
        fetchStats()
      }
    } catch (error) {
      console.error('Error creating expense:', error)
    }
  }

  const handleUpdateExpense = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        setEditingExpense(null)
        fetchExpenses()
        fetchStats()
      }
    } catch (error) {
      console.error('Error updating expense:', error)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот расход?')) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchExpenses()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const clearFilters = () => {
    setSelectedOwners([])
    setSelectedProperties([])
    setDateFrom('')
    setDateTo('')
  }

  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const canDelete = user?.role === 'admin'

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Расходы</h1>
            <p className="text-gray-600 mt-1">Управление расходами недвижимости</p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard')}
            variant="outline"
          >
            Назад к дашборду
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общая сумма</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Все расходы</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Текущий месяц</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.currentMonthAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">За этот месяц</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Текущий год</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.currentYearAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">За этот год</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">За период</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.periodAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">С учетом фильтров</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Фильтры</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="owners">Владельцы</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите владельцев" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите объекты" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFrom">Дата с</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Дата по</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Очистить фильтры
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Расходы</CardTitle>
            {canManage && (
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить расход
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Сумма ($)</TableHead>
                  <TableHead>Объект</TableHead>
                  <TableHead>Комментарий</TableHead>
                  {canManage && <TableHead>Действия</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAddingNew && canManage && (
                  <TableRow>
                    <TableCell>
                      <Input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={newExpense.type_id}
                        onValueChange={(value) => setNewExpense({...newExpense, type_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={newExpense.amount_usd}
                        onChange={(e) => setNewExpense({...newExpense, amount_usd: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={newExpense.property_id}
                        onValueChange={(value) => setNewExpense({...newExpense, property_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите объект" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map(property => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newExpense.comment}
                        onChange={(e) => setNewExpense({...newExpense, comment: e.target.value})}
                        placeholder="Комментарий"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleCreateExpense}>
                          Сохранить
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsAddingNew(false)}>
                          Отмена
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>{expense.expense_type?.name}</TableCell>
                    <TableCell>${expense.amount_usd.toLocaleString()}</TableCell>
                    <TableCell>{expense.property?.name}</TableCell>
                    <TableCell>{expense.comment || '-'}</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingExpense(expense.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
