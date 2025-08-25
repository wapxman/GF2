'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export default function Login() {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('login', formData.login)
        .single()

      if (fetchError || !user) {
        setError('Неверный логин или пароль')
        setLoading(false)
        return
      }

      const isPasswordValid = await bcrypt.compare(formData.password, user.password)

      if (!isPasswordValid) {
        setError('Неверный логин или пароль')
        setLoading(false)
        return
      }

      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        login: user.login,
        first_name: user.first_name,
        last_name: user.last_name
      }))

      router.push('/dashboard')
    } catch (err) {
      setError('Произошла ошибка при входе')
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="apple-card max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Вход</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-2">
              Логин
            </label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              required
              className="apple-input"
              placeholder="Введите логин"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="apple-input"
              placeholder="Введите пароль"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="apple-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/register" className="text-blue-500 hover:text-blue-600 transition-colors">
            Нет аккаунта? Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  )
}
