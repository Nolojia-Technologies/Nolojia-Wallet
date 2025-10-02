import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Receipt,
  TrendingUp,
  CreditCard,
  Activity,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // Mock user data for demo purposes
  const mockUser = {
    firstName: 'Demo',
    lastName: 'User',
    userCode: 'DEMO1234',
    trustScore: 4.8,
    wallet: { balance: 50000 }
  }

  const displayUser = user || mockUser

  const [stats, setStats] = useState({
    totalTransactions: 0,
    monthlyVolume: 0,
    escrowActive: 0,
    trustScore: displayUser?.trustScore || 4.8,
  })

  const [isBalanceVisible, setIsBalanceVisible] = useState(true)

  // Load balance visibility preference from localStorage and listen for changes
  useEffect(() => {
    const savedPreference = localStorage.getItem('balanceVisible')
    if (savedPreference !== null) {
      setIsBalanceVisible(JSON.parse(savedPreference))
    }

    // Listen for localStorage changes from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'balanceVisible' && e.newValue !== null) {
        setIsBalanceVisible(JSON.parse(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    // Simulate loading stats
    setStats({
      totalTransactions: 156,
      monthlyVolume: 45000,
      escrowActive: 3,
      trustScore: displayUser?.trustScore || 4.8,
    })
  }, [user])

  const quickActions = [
    {
      title: 'Send Money',
      description: 'Transfer funds to another wallet',
      icon: ArrowUpRight,
      href: '/send',
      color: 'bg-blue-500',
    },
    {
      title: 'Receive Money',
      description: 'Generate QR code for payments',
      icon: ArrowDownLeft,
      href: '/receive',
      color: 'bg-green-500',
    },
    {
      title: 'Escrow Transaction',
      description: 'Secure buyer-seller transaction',
      icon: Shield,
      href: '/escrow',
      color: 'bg-purple-500',
    },
    {
      title: 'Digital Receipts',
      description: 'View and manage receipts',
      icon: Receipt,
      href: '/receipts',
      color: 'bg-orange-500',
    },
  ]

  const recentTransactions = [
    {
      id: '1',
      type: 'TRANSFER',
      amount: -2500,
      description: 'Payment to John Doe',
      date: '2024-01-15',
      status: 'COMPLETED',
    },
    {
      id: '2',
      type: 'DEPOSIT',
      amount: 10000,
      description: 'M-Pesa deposit',
      date: '2024-01-14',
      status: 'COMPLETED',
    },
    {
      id: '3',
      type: 'ESCROW_CREATE',
      amount: -15000,
      description: 'Escrow for iPhone purchase',
      date: '2024-01-13',
      status: 'PENDING',
    },
  ]

  const getTrustStatusColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600'
    if (score >= 3.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrustStatusText = (score: number) => {
    if (score >= 4.5) return 'Excellent'
    if (score >= 3.0) return 'Good'
    return 'Poor'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {displayUser?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your wallet today.
        </p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-kenya-red to-red-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white/90">Wallet Balance</CardTitle>
              <CardDescription className="text-white/70">
                Available funds in your account
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/app/topup')}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Plus className="h-4 w-4 mr-1" />
                Top Up
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newVisibility = !isBalanceVisible
                  setIsBalanceVisible(newVisibility)
                  localStorage.setItem('balanceVisible', JSON.stringify(newVisibility))
                }}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                {isBalanceVisible ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-4">
            {isBalanceVisible
              ? formatCurrency((displayUser as any)?.wallet?.balance || 0)
              : '••••••••'
            }
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/80">
              User Code: {displayUser?.userCode}
            </div>
            <div className="flex items-center space-x-2">
              <div className={`text-sm ${getTrustStatusColor(stats.trustScore)}`}>
                Trust Score: {stats.trustScore}/5.0 ({getTrustStatusText(stats.trustScore)})
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} to={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`${action.color} p-3 rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Account Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.monthlyVolume)}
                  </p>
                  <p className="text-sm text-muted-foreground">Monthly Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.escrowActive}</p>
                  <p className="text-sm text-muted-foreground">Active Escrows</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <CreditCard className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">KES</p>
                  <p className="text-sm text-muted-foreground">Primary Currency</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <Link to="/transactions">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.amount > 0 ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className={`text-sm ${
                      transaction.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}