import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Send,
  Download,
  History,
  Shield,
  Receipt,
  Users,
  HeadphonesIcon,
  Lock,
  Coins,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: Home },
  { name: 'Top Up Wallet', href: '/app/topup', icon: Plus },
  { name: 'Send Money', href: '/app/send', icon: Send },
  { name: 'Receive Money', href: '/app/receive', icon: Download },
  { name: 'Escrow', href: '/app/escrow', icon: Lock },
  { name: 'Community Finance', href: '/app/community-finance', icon: Coins },
  { name: 'Transaction History', href: '/app/transactions', icon: History },
  { name: 'Digital Receipts', href: '/app/receipts', icon: Receipt },
  { name: 'Payroll', href: '/app/payroll', icon: Users },
  { name: 'Support', href: '/app/support', icon: HeadphonesIcon },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex flex-col flex-grow">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-kenya-red text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Fraud Check Section */}
          <div className="mt-8 px-2">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-kenya-red" />
                <span className="text-sm font-medium text-gray-900">Fraud Check</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Verify users and check trust scores
              </p>
              <Link
                to="/fraud-check"
                className="block w-full bg-kenya-red text-white text-center px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Check Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}