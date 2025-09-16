import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Wallet } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import { LoginRequest } from '@/types'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data)
      navigate('/app/dashboard')
    } catch (error: any) {
      setError('root', {
        message: error.message || 'Login failed',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kenya-red to-red-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-lg">
            <Wallet className="h-12 w-12 text-kenya-red" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Nolojia Wallet</h1>
          <p className="text-red-100">Digital Wallet for Kenya</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your Nolojia Wallet account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Demo Credentials */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">Demo Credentials</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Email:</strong> demo@nolojia.com</p>
                <p><strong>Password:</strong> password</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {errors.root.message}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password', {
                      required: 'Password is required',
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                variant="kenya"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-kenya-red hover:text-red-700 font-medium"
                >
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/fraud-check"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Check Fraud Status
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-red-100 text-sm">
          <p>&copy; 2024 Nolojia Wallet. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}