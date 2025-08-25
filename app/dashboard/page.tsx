'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  login: string
  first_name: string
  last_name: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    
    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (err) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="apple-card max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Добро пожаловать!
            </h1>
            <div className="text-lg text-gray-600 mb-8">
              <p>Привет, {user.first_name} {user.last_name}!</p>
              <p className="text-sm text-gray-500 mt-2">Логин: {user.login}</p>
            </div>
            <button
              onClick={handleLogout}
              className="apple-button bg-red-500 hover:bg-red-600"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
