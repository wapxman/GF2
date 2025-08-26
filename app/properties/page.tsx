'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { User } from '@/types/auth'
import { PropertyWithOwners, PropertyStats, CreatePropertyRequest } from '@/types/property'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building, 
  Users, 
  DollarSign, 
  BarChart3,
  X
} from 'lucide-react'

interface UserOption {
  id: string
  first_name: string
  last_name: string
  login: string
}

interface OwnershipForm {
  user_id: string
  share_pct: number
}

export default function PropertiesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<PropertyWithOwners[]>([])
  const [stats, setStats] = useState<PropertyStats | null>(null)
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<PropertyWithOwners | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    area_sqm: '',
    rent_rate_usd: ''
  })
  const [ownerships, setOwnerships] = useState<OwnershipForm[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
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
      fetchProperties()
      fetchStats()
      fetchUsers()
    }
  }, [user, selectedOwners, selectedProperties])

  const fetchProperties = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedOwners.length > 0) {
        params.append('owners', selectedOwners.join(','))
      }
      if (selectedProperties.length > 0) {
        params.append('properties', selectedProperties.join(','))
      }

      const response = await fetch(`/api/properties?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedOwners.length > 0) {
        params.append('owners', selectedOwners.join(','))
      }
      if (selectedProperties.length > 0) {
        params.append('properties', selectedProperties.join(','))
      }

      const response = await fetch(`/api/properties/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
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

  const handleAddProperty = async () => {
    setSubmitting(true)
    setError('')

    try {
      const totalShare = ownerships.reduce((sum, o) => sum + o.share_pct, 0)
      if (Math.abs(totalShare - 100) > 0.01) {
        setError('Сумма долей владения должна составлять 100%')
        setSubmitting(false)
        return
      }

      const requestData: CreatePropertyRequest = {
        name: formData.name,
        address: formData.address,
        area_sqm: parseFloat(formData.area_sqm),
        rent_rate_usd: parseFloat(formData.rent_rate_usd),
        owners: ownerships
      }

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        setIsAddModalOpen(false)
        resetForm()
        fetchProperties()
        fetchStats()
      } else {
        const data = await response.json()
        setError(data.error || 'Ошибка при создании объекта')
      }
    } catch (error) {
      setError('Произошла ошибка при создании объекта')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProperty = async () => {
    if (!editingProperty) return

    setSubmitting(true)
    setError('')

    try {
      const totalShare = ownerships.reduce((sum, o) => sum + o.share_pct, 0)
      if (Math.abs(totalShare - 100) > 0.01) {
        setError('Сумма долей владения должна составлять 100%')
        setSubmitting(false)
        return
      }

      const requestData = {
        name: formData.name,
        address: formData.address,
        area_sqm: parseFloat(formData.area_sqm),
        rent_rate_usd: parseFloat(formData.rent_rate_usd),
        owners: ownerships
      }

      const response = await fetch(`/api/properties/${editingProperty.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        setEditingProperty(null)
        resetForm()
        fetchProperties()
        fetchStats()
      } else {
        const data = await response.json()
        setError(data.error || 'Ошибка при обновлении объекта')
      }
    } catch (error) {
      setError('Произошла ошибка при обновлении объекта')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот объект недвижимости?')) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchProperties()
        fetchStats()
      } else {
        const data = await response.json()
        alert(data.error || 'Ошибка при удалении объекта')
      }
    } catch (error) {
      alert('Произошла ошибка при удалении объекта')
    }
  }

  const openEditModal = (property: PropertyWithOwners) => {
    setEditingProperty(property)
    setFormData({
      name: property.name,
      address: property.address,
      area_sqm: property.area_sqm.toString(),
      rent_rate_usd: property.rent_rate_usd.toString()
    })
    setOwnerships(property.owners.map(owner => ({
      user_id: owner.user_id,
      share_pct: owner.share_pct
    })))
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      area_sqm: '',
      rent_rate_usd: ''
    })
    setOwnerships([])
    setError('')
  }

  const addOwnership = () => {
    setOwnerships([...ownerships, { user_id: '', share_pct: 0 }])
  }

  const removeOwnership = (index: number) => {
    setOwnerships(ownerships.filter((_, i) => i !== index))
  }

  const updateOwnership = (index: number, field: keyof OwnershipForm, value: string | number) => {
    const updated = [...ownerships]
    updated[index] = { ...updated[index], [field]: value }
    setOwnerships(updated)
  }

  const distributeEqually = () => {
    if (ownerships.length === 0) return
    const sharePerOwner = 100 / ownerships.length
    setOwnerships(ownerships.map(o => ({ ...o, share_pct: sharePerOwner })))
  }

  const clearFilters = () => {
    setSelectedOwners([])
    setSelectedProperties([])
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Недвижимость</h1>
            <p className="text-gray-600 mt-1">Управление объектами недвижимости</p>
          </div>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              ← Назад к дашборду
            </Button>
            {canManage && (
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить объект
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Добавить объект недвижимости</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Название</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Название объекта"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Адрес</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          placeholder="Адрес объекта"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="area">Площадь (м²)</Label>
                        <Input
                          id="area"
                          type="number"
                          value={formData.area_sqm}
                          onChange={(e) => setFormData({...formData, area_sqm: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rent">Ставка аренды ($/мес)</Label>
                        <Input
                          id="rent"
                          type="number"
                          value={formData.rent_rate_usd}
                          onChange={(e) => setFormData({...formData, rent_rate_usd: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Владельцы</Label>
                        <div className="space-x-2">
                          <Button type="button" variant="outline" size="sm" onClick={distributeEqually}>
                            Поровну
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={addOwnership}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {ownerships.map((ownership, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
                          <Select
                            value={ownership.user_id}
                            onValueChange={(value) => updateOwnership(index, 'user_id', value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Выберите владельца" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.first_name} {user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={ownership.share_pct}
                            onChange={(e) => updateOwnership(index, 'share_pct', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-20"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOwnership(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <p className="text-sm text-gray-600">
                        Сумма: {ownerships.reduce((sum, o) => sum + o.share_pct, 0).toFixed(1)}%
                      </p>
                    </div>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleAddProperty} disabled={submitting}>
                      {submitting ? 'Создание...' : 'Создать'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Объектов</p>
                    <p className="text-xl font-bold">{stats.total_properties}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Площадь (м²)</p>
                    <p className="text-xl font-bold">{stats.total_area.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Доход/мес ($)</p>
                    <p className="text-xl font-bold">{stats.expected_monthly_income.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">$/м²</p>
                    <p className="text-xl font-bold">{stats.average_rate_per_sqm.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Совладение</p>
                    <p className="text-xl font-bold">{stats.multi_owner_properties}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Фильтры</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 items-end">
              <div className="flex-1">
                <Label>Владельцы</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите владельцев" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Объекты</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите объекты" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Очистить фильтры
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Объекты недвижимости</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Площадь (м²)</TableHead>
                  <TableHead>Ставка ($/мес)</TableHead>
                  <TableHead>Владельцы</TableHead>
                  <TableHead>Доли (%)</TableHead>
                  {canManage && <TableHead>Действия</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell>{property.area_sqm}</TableCell>
                    <TableCell>${property.rent_rate_usd}</TableCell>
                    <TableCell>
                      {property.owners.map(owner => 
                        `${owner.first_name} ${owner.last_name}`
                      ).join(', ')}
                    </TableCell>
                    <TableCell>
                      {property.owners.map(owner => 
                        `${owner.share_pct}%`
                      ).join(', ')}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(property)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProperty(property.id)}
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

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать объект недвижимости</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Название</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Название объекта"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-address">Адрес</Label>
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Адрес объекта"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-area">Площадь (м²)</Label>
                  <Input
                    id="edit-area"
                    type="number"
                    value={formData.area_sqm}
                    onChange={(e) => setFormData({...formData, area_sqm: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-rent">Ставка аренды ($/мес)</Label>
                  <Input
                    id="edit-rent"
                    type="number"
                    value={formData.rent_rate_usd}
                    onChange={(e) => setFormData({...formData, rent_rate_usd: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Владельцы</Label>
                  <div className="space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={distributeEqually}>
                      Поровну
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addOwnership}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {ownerships.map((ownership, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <Select
                      value={ownership.user_id}
                      onValueChange={(value) => updateOwnership(index, 'user_id', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Выберите владельца" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={ownership.share_pct}
                      onChange={(e) => updateOwnership(index, 'share_pct', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOwnership(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-sm text-gray-600">
                  Сумма: {ownerships.reduce((sum, o) => sum + o.share_pct, 0).toFixed(1)}%
                </p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleEditProperty} disabled={submitting}>
                {submitting ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
