# Grand Floor - Система управления недвижимостью

MVP система управления недвижимостью с аутентификацией, ролевым доступом и дашбордом.

## Функционал Stage 1

- **Регистрация** (`/register`): Форма с полями first_name, last_name, phone (опционально), login, password
- **Вход** (`/login`): Форма с полями login, password с rate limiting
- **Дашборд** (`/dashboard`): Защищенная страница с боковым меню и ролевым доступом
- **Роли**: admin, manager, owner с различными уровнями доступа
- **Безопасные сессии**: JWT токены в HTTP-only cookies

## Технологии

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase
- bcryptjs для хеширования паролей
- JWT для сессий
- Middleware для защиты маршрутов

## Настройка

1. Установите зависимости:
```bash
npm install
```

2. Примените миграцию базы данных в Supabase SQL Editor:
```sql
-- Выполните содержимое файла supabase/migrations/001_add_phone_and_role_to_users.sql
```

3. Настройте переменные окружения в `.env.local`:
```
DATABASE_URL=your_database_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
```

4. Запустите проект:
```bash
npm run dev
```

## Структура

### Страницы
- `/register` - Регистрация (первый пользователь становится admin)
- `/login` - Вход в систему
- `/dashboard` - Главная страница с боковым меню

### API маршруты
- `/api/register` - Регистрация с автоматическим назначением ролей
- `/api/login` - Вход с rate limiting и JWT токенами
- `/api/logout` - Выход из системы
- `/api/me` - Получение информации о текущем пользователе

### Компоненты
- `components/ui/*` - shadcn/ui компоненты
- `types/auth.ts` - TypeScript интерфейсы
- `lib/auth.ts` - JWT утилиты
- `middleware.ts` - Защита маршрутов

## Роли и доступы

- **admin**: Полный доступ ко всем функциям, включая администрирование
- **manager**: Доступ к большинству функций, кроме удаления пользователей/объектов
- **owner**: Доступ только к объектам, где есть доля владения

## Безопасность

- Пароли хешируются с помощью bcrypt
- JWT токены в HTTP-only cookies
- Rate limiting на API входа (5 попыток за 15 минут)
- Middleware для защиты маршрутов
- Ролевой контроль доступа
- Все операции с БД через service role key

## Схема базы данных

```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  role text DEFAULT 'owner' CHECK (role IN ('admin', 'manager', 'owner')),
  created_at timestamptz DEFAULT now()
);
```

## Следующие этапы

Система подготовлена для реализации следующих этапов:
- Администрирование пользователей
- Управление недвижимостью
- Учет доходов и расходов
- Финансовая отчетность
- Аналитика
