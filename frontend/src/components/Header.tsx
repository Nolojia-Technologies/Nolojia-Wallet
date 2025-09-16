import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  Home,
  Send,
  Download,
  History,
  Shield,
  Receipt,
  Users,
  HeadphonesIcon,
  Eye,
  EyeOff,
  Coins,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: Home },
  { name: 'Send Money', href: '/app/send', icon: Send },
  { name: 'Receive Money', href: '/app/receive', icon: Download },
  { name: 'Escrow', href: '/app/escrow', icon: Shield },
  { name: 'Community Finance', href: '/app/community-finance', icon: Coins },
  { name: 'Transaction History', href: '/app/transactions', icon: History },
  { name: 'Digital Receipts', href: '/app/receipts', icon: Receipt },
  { name: 'Payroll', href: '/app/payroll', icon: Users },
  { name: 'Support', href: '/app/support', icon: HeadphonesIcon },
]

export function Header() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)

  // Load balance visibility preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('balanceVisible')
    if (savedPreference !== null) {
      setIsBalanceVisible(JSON.parse(savedPreference))
    }
  }, [])

  // Save balance visibility preference to localStorage
  const toggleBalanceVisibility = () => {
    const newVisibility = !isBalanceVisible
    setIsBalanceVisible(newVisibility)
    localStorage.setItem('balanceVisible', JSON.stringify(newVisibility))
  }

  const handleLogout = () => {
    logout()
  }

  // Mock user data for demo purposes when no user is logged in
  const mockUser = {
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@nolojia.com',
    userCode: 'DEMO1234',
    wallet: { balance: 50000 }
  }

  const displayUser = user || mockUser
  const userInitials = `${displayUser.firstName[0]}${displayUser.lastName[0]}`

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/app/dashboard" className="flex items-center space-x-2">
              <div className="bg-kenya-red p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Nolojia Wallet
              </span>
            </Link>
          </div>


          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Balance Display (Desktop) */}
            <div className="hidden md:flex bg-gray-100 rounded-lg px-3 py-2 items-center">
              <span className="text-sm text-gray-600">Balance:</span>
              <span className="ml-2 font-semibold text-lg">
                {isBalanceVisible
                  ? formatCurrency((displayUser as any)?.wallet?.balance || 0)
                  : '••••••••'
                }
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBalanceVisibility}
                className="ml-2 h-6 w-6 p-0 hover:bg-gray-200"
              >
                {isBalanceVisible ? (
                  <EyeOff className="h-4 w-4 text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-600" />
                )}
              </Button>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative hidden md:flex">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-kenya-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Fraud Check Link */}
            <Link to="/fraud-check">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Shield className="mr-2 h-4 w-4" />
                Fraud Check
              </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt={displayUser?.firstName} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {displayUser?.firstName} {displayUser?.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {displayUser?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Code: {displayUser?.userCode}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 mt-4 pt-4">
            <div className="space-y-1">
              {/* Balance Display (Mobile) */}
              <div className="bg-gray-100 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Balance:</span>
                  <span className="ml-2 font-semibold text-lg">
                    {isBalanceVisible
                      ? formatCurrency((displayUser as any)?.wallet?.balance || 0)
                      : '••••••••'
                    }
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleBalanceVisibility}
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                >
                  {isBalanceVisible ? (
                    <EyeOff className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-600" />
                  )}
                </Button>
              </div>

              {/* Navigation Links */}
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium',
                      isActive
                        ? 'bg-kenya-red text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}

              <div className="border-t border-gray-200 mt-4 pt-4 space-y-1">
                <Link to="/fraud-check">
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    Fraud Check
                  </Button>
                </Link>

                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications (3)
                </Button>

                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}