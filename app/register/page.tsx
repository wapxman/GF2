'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export default function Register() {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    first_name: '',
    last_name: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('login')
        .eq('login', formData.login)
        .single()

      if (existingUser) {
        setError('Пользователь с таким логином уже существует')
        setLoading(false)
        return
      }

      const hashedPassword = await bcrypt.hash(formData.password, 10)

      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            login: formData.login,
            password: hashedPassword,
            first_name: formData.first_name,
            last_name: formData.last_name
          }
        ])

      if (insertError) {
        setError('Ошибка при регистрации: ' + insertError.message)
      } else {
        router.push('/login')
      }
    } catch (err) {
      setError('Произошла ошибка при регистрации')
    }

    setLoading(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Регистрация</h1>
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

          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
              Имя
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="apple-input"
              placeholder="Введите имя"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
              Фамилия
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="apple-input"
              placeholder="Введите фамилию"
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
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-blue-500 hover:text-blue-600 transition-colors">
            Уже есть аккаунт? Войти
          </Link>
        </div>
      </div>
    </div>
  )
}
