'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Role } from '@/types/auth'
import { 
  Home, 
  Building, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield
} from 'lucide-react'

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
  visible?: boolean
}

function SidebarItem({ icon, label, active = false, onClick, visible = true }: SidebarItemProps) {
  if (!visible) return null
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')
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

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      router.push('/login')
    }
  }

  const canAccessAdmin = user?.role === 'admin'
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const isOwner = user?.role === 'owner'

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
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Grand Floor</h2>
          <p className="text-sm text-gray-600 mt-1">
            {user.first_name} {user.last_name}
          </p>
          <div className="flex items-center mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              user.role === 'admin' ? 'bg-red-100 text-red-800' :
              user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
              {user.role === 'admin' ? 'Администратор' : 
               user.role === 'manager' ? 'Менеджер' : 'Владелец'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem
            icon={<Home className="w-5 h-5" />}
            label="Дашборд"
            active={activeSection === 'dashboard'}
            onClick={() => setActiveSection('dashboard')}
          />
          <SidebarItem
            icon={<Building className="w-5 h-5" />}
            label="Недвижимость"
            active={activeSection === 'properties'}
            onClick={() => router.push('/properties')}
          />
          <SidebarItem
  icon={<Users className="w-5 h-5" />}
  label="Владельцы"
  active={activeSection === 'owners'}
  onClick={() => setActiveSection('owners')}
  visible={canManage}
/>
<SidebarItem
  icon={<TrendingUp className="w-5 h-5" />}
  label="Доход"
  active={activeSection === 'income'}
  onClick={() => router.push('/income')}
  visible={canManage || isOwner}
/>
<SidebarItem
  icon={<TrendingDown className="w-5 h-5" />}
  label="Расход"
  active={activeSection === 'expenses'}
  onClick={() => router.push('/expenses')}
  visible={canManage || isOwner}
/>

          <SidebarItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Финансы"
            active={activeSection === 'finance'}
            onClick={() => setActiveSection('finance')}
            visible={canManage || isOwner}
          />
          <SidebarItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Аналитика"
            active={activeSection === 'analytics'}
            onClick={() => setActiveSection('analytics')}
            visible={canManage || isOwner}
          />
          <SidebarItem
            icon={<Shield className="w-5 h-5" />}
            label="Администрирование"
            active={activeSection === 'admin'}
            onClick={() => window.location.href = '/admin/users'}
            visible={canAccessAdmin}
          />
          <SidebarItem
            icon={<Settings className="w-5 h-5" />}
            label="Настройки"
            active={activeSection === 'settings'}
            onClick={() => setActiveSection('settings')}
          />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Выход
          </Button>
        </div>
      </div>

      <div className="flex-1 p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Добро пожаловать!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Добро пожаловать в систему управления недвижимостью Grand Floor.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">Ваша роль</h3>
                  <p className="text-blue-700 capitalize">{
                    user.role === 'admin' ? 'Администратор' : 
                    user.role === 'manager' ? 'Менеджер' : 'Владелец'
                  }</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900">Статус</h3>
                  <p className="text-green-700">Активен</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Информация о пользователе</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Имя:</span> {user.first_name} {user.last_name}</p>
                  <p><span className="font-medium">Логин:</span> {user.login}</p>
                  {user.phone && <p><span className="font-medium">Телефон:</span> {user.phone}</p>}
                  <p><span className="font-medium">Дата регистрации:</span> {new Date(user.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
