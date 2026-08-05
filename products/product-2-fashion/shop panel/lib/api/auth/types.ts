export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  name: string
}