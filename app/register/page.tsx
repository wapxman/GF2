'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Register() {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [canRegister, setCanRegister] = useState(false)
  const [checkingUsers, setCheckingUsers] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUserCount = async () => {
      try {
        const response = await fetch('/api/me')
        if (response.ok) {
          router.push('/dashboard')
          return
        }
        setCanRegister(true)
      } catch (error) {
        setCanRegister(true)
      } finally {
        setCheckingUsers(false)
      }
    }

    checkUserCount()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const baseUrl = window.location.origin
      const apiUrl = baseUrl.includes('@') 
        ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api/register`
        : '/api/register'
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        try {
          const data = await response.json()
          setError(data.error || 'Произошла ошибка при регистрации')
        } catch (parseError) {
          setError('Произошла ошибка при регистрации')
        }
        setLoading(false)
        return
      }

      const data = await response.json()
      router.push('/dashboard')
    } catch (error) {
      console.error('Registration network error:', error)
      setError('Произошла ошибка соединения. Попробуйте еще раз.')
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (checkingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!canRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">Регистрация недоступна</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Регистрация новых пользователей временно недоступна.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Войти в систему
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Регистрация</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Имя</Label>
              <Input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="Введите имя"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Фамилия</Label>
              <Input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder="Введите фамилию"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон (необязательно)</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login">Логин</Label>
              <Input
                type="text"
                id="login"
                name="login"
                value={formData.login}
                onChange={handleChange}
                required
                placeholder="Введите логин"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Введите пароль"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors text-sm">
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
