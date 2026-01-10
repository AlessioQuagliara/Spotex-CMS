import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Invia cookie automaticamente
})

// Interceptor per gestire errori
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token scaduto o non valido
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Types per le risposte API
export interface ApiResponse<T> {
  data: T
  message?: string
}

// Auth types
export interface LoginRequest {
  username: string
  password: string
}

export interface Token {
  access_token: string
  token_type: string
  user: User
}

export interface LoginResponse extends Token {}

export interface User {
  id: number
  email: string
  username: string
  full_name?: string
  role: 'admin' | 'editor' | 'author' | 'subscriber'
  is_active: boolean
  profile_picture?: string
  created_at: string
}

// Auth API calls
export const authApi = {
  login: (data: LoginRequest) => 
    api.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<RegisterResponse>('/auth/register', data),
  
  logout: () => 
    api.post('/auth/logout'),
  
  refreshToken: () => 
    api.post<LoginResponse>('/auth/refresh'),
  
  getMe: () => 
    api.get<User>('/auth/me'),
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  full_name?: string
  role?: string
}

export type RegisterResponse = Token
