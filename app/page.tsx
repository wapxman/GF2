import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="apple-card max-w-md w-full mx-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Добро пожаловать
          </h1>
          <h2 className="text-xl text-gray-700 mb-8">
            Регистрация пользователя GF
          </h2>
          <div className="space-y-4">
            <Link 
              href="/register" 
              className="apple-button block text-center"
            >
              Регистрация
            </Link>
            <Link 
              href="/login" 
              className="apple-button block text-center bg-gray-600 hover:bg-gray-700"
            >
              Вход
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
