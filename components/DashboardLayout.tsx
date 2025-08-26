'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User } from '@/types/auth'
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
      className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
  activeSection?: string
}

export default function DashboardLayout({ children, activeSection = 'dashboard' }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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

  const handleNavigation = (section: string, path?: string) => {
    if (path) {
      router.push(path)
    }
  }

  const canAccessAdmin = user?.role === 'admin'

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
            onClick={() => handleNavigation('dashboard', '/dashboard')}
          />
          <SidebarItem
            icon={<Building className="w-5 h-5" />}
            label="Недвижимость"
            active={activeSection === 'properties'}
            onClick={() => handleNavigation('properties', '/properties')}
          />
          <SidebarItem
            icon={<Users className="w-5 h-5" />}
            label="Владельцы"
            active={activeSection === 'owners'}
            onClick={() => handleNavigation('owners')}
          />
          <SidebarItem
            icon={<TrendingUp className="w-5 h-5" />}
            label="Доход"
            active={activeSection === 'income'}
            onClick={() => handleNavigation('income', '/income')}
          />
          <SidebarItem
            icon={<TrendingDown className="w-5 h-5" />}
            label="Расход"
            active={activeSection === 'expenses'}
            onClick={() => handleNavigation('expenses', '/expenses')}
          />
          <SidebarItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Финансы"
            active={activeSection === 'finance'}
            onClick={() => handleNavigation('finance')}
          />
          <SidebarItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Аналитика"
            active={activeSection === 'analytics'}
            onClick={() => handleNavigation('analytics')}
          />
          <SidebarItem
            icon={<Shield className="w-5 h-5" />}
            label="Администрирование"
            active={activeSection === 'admin'}
            onClick={() => handleNavigation('admin')}
            visible={canAccessAdmin}
          />
          <SidebarItem
            icon={<Settings className="w-5 h-5" />}
            label="Настройки"
            active={activeSection === 'settings'}
            onClick={() => handleNavigation('settings')}
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

      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
