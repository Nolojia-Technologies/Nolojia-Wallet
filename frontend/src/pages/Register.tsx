import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Wallet } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import { RegisterRequest } from '@/types'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterRequest>()

  const onSubmit = async (data: RegisterRequest) => {
    try {
      await registerUser(data)
      navigate('/dashboard')
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.message || 'Registration failed',
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
          <p className="text-red-100">Create Your Digital Wallet</p>
        </div>

        {/* Registration Form */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Join thousands of Kenyans using Nolojia Wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {errors.root.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters',
                      },
                    })}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters',
                      },
                    })}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

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
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  placeholder="+254712345678"
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\+254[17]\d{8}$/,
                      message: 'Enter a valid Kenyan phone number (+254xxxxxxxxx)',
                    },
                  })}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="nationalId" className="text-sm font-medium">
                  National ID
                </label>
                <Input
                  id="nationalId"
                  placeholder="12345678"
                  {...register('nationalId', {
                    required: 'National ID is required',
                    pattern: {
                      value: /^\d{8}$/,
                      message: 'National ID must be 8 digits',
                    },
                  })}
                />
                {errors.nationalId && (
                  <p className="text-sm text-red-600">{errors.nationalId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="kraPin" className="text-sm font-medium">
                  KRA PIN (Optional)
                </label>
                <Input
                  id="kraPin"
                  placeholder="A000000000A"
                  {...register('kraPin', {
                    pattern: {
                      value: /^[A-Z]\d{9}[A-Z]$/,
                      message: 'KRA PIN must be in format: A000000000A',
                    },
                  })}
                />
                {errors.kraPin && (
                  <p className="text-sm text-red-600">{errors.kraPin.message}</p>
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
                    placeholder="Create a strong password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                        message: 'Password must contain uppercase, lowercase, number, and special character',
                      },
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
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-kenya-red hover:text-red-700 font-medium"
                >
                  Sign in here
                </Link>
              </p>
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