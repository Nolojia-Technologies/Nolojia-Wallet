import { AuthResponse, LoginRequest, RegisterRequest } from '@/types'
// import { apiClient } from './apiClient'

// Mock users database (in real app, this would be handled by backend)
// Load existing users from localStorage or start with default demo user
const loadUsers = () => {
  const stored = localStorage.getItem('nolojia-users')
  if (stored) {
    return JSON.parse(stored).map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    }))
  }
  return [
    {
      id: 'u1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'demo@nolojia.com',
      phone: '+254712345678',
      nationalId: '12345678',
      userCode: 'DEMO1234',
      trustScore: 4.8,
      isVerified: true,
      isBlacklisted: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      wallet: { balance: 50000 },
      password: 'password' // Add password for authentication
    }
  ]
}

const mockUsers = loadUsers()

// Save users to localStorage
const saveUsers = () => {
  localStorage.setItem('nolojia-users', JSON.stringify(mockUsers))
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Mock authentication - in real app, validate with backend
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Find user by email or userCode
        const user = mockUsers.find(u =>
          (u.email === credentials.email || u.userCode === credentials.email) &&
          (u as any).password === credentials.password
        )

        if (user) {
          // Remove password from response
          const { password, ...userWithoutPassword } = user as any
          resolve({
            user: userWithoutPassword,
            token: 'mock-jwt-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now()
          })
        } else {
          reject(new Error('Invalid email/user code or password'))
        }
      }, 1000) // Simulate network delay
    })
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Mock registration - in real app, create user in backend
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check if email already exists
        if (mockUsers.some(user => user.email === data.email)) {
          reject(new Error('Email already exists'))
          return
        }

        const newUser = {
          id: 'u' + Date.now(),
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          nationalId: data.nationalId,
          userCode: 'USR' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          trustScore: 3.0,
          isVerified: false,
          isBlacklisted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          wallet: { balance: 0 },
          password: data.password // Store password for authentication
        }

        mockUsers.push(newUser)
        saveUsers() // Persist to localStorage

        // Remove password from response
        const { password, ...userWithoutPassword } = newUser
        resolve({
          user: userWithoutPassword,
          token: 'mock-jwt-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now()
        })
      }, 1500) // Simulate network delay
    })
  },

  async refreshToken(): Promise<AuthResponse> {
    // Mock refresh token - in real app, validate and refresh with backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: mockUsers[0],
          token: 'mock-jwt-token-refreshed-' + Date.now(),
          refreshToken: 'mock-refresh-token-refreshed-' + Date.now()
        })
      }, 500)
    })
  },

  async verifyKYC(): Promise<{ verified: boolean }> {
    // Mock KYC verification
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ verified: true })
      }, 2000)
    })
  },

  async logout(): Promise<void> {
    // Mock logout - in real app, invalidate token on backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 500)
    })
  },

  async forgotPassword(): Promise<{ message: string }> {
    // Mock password reset
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ message: 'Password reset instructions sent to your email' })
      }, 1000)
    })
  },

  async resetPassword(): Promise<{ message: string }> {
    // Mock password reset
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ message: 'Password reset successfully' })
      }, 1000)
    })
  },
}