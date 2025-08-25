export interface User {
  id: string
  login: string
  first_name: string
  last_name: string
  phone?: string
  role: Role
  created_at: string
}

export type Role = 'admin' | 'manager' | 'owner'

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

export interface LoginRequest {
  login: string
  password: string
}

export interface RegisterRequest {
  login: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}
