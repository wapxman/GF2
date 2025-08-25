# Next.js 14 + Supabase Authentication

Минимальный проект для авторизации с использованием Next.js 14, TypeScript, TailwindCSS и Supabase.

## Функционал

- **Регистрация** (`/register`) - форма с полями login, password, first_name, last_name
- **Вход** (`/login`) - форма с полями login, password  
- **Дашборд** (`/dashboard`) - защищенная страница с приветствием

## Технологии

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS (стилизация в стиле Apple)
- Supabase
- bcryptjs для хеширования паролей

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте таблицу `users` в Supabase:
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  login VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. Запустите проект:
```bash
npm run dev
```

## Переменные окружения

Файл `.env.local` уже настроен с вашими ключами Supabase.

## Структура проекта

```
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   └── dashboard/
│       └── page.tsx
├── lib/
│   └── supabase.ts
└── ...
```
