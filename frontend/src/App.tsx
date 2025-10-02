import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from "@/components/ui/toaster"

// Pages
import LandingPage from '@/pages/LandingPage'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import SendMoney from '@/pages/SendMoney'
import ReceiveMoney from '@/pages/ReceiveMoney'
import TransactionHistory from '@/pages/TransactionHistory'
import FraudCheck from '@/pages/FraudCheck'
import PayrollModule from '@/pages/PayrollModule'
import DigitalReceipts from '@/pages/DigitalReceipts'
import Support from '@/pages/Support'
import Escrow from '@/pages/Escrow'
import CommunityFinance from '@/pages/CommunityFinance'
import TopUpWallet from '@/pages/TopUpWallet'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'

// Components
import { AuthGuard } from '@/components/AuthGuard'
import { Layout } from '@/components/Layout'
import { ThemeProvider } from '@/contexts/ThemeContext'

// Store
import { useAuthStore } from '@/store/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background transition-colors">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <LandingPage />}
            />
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Register />}
            />
            <Route
              path="/fraud-check"
              element={<FraudCheck />}
            />

            {/* Protected Routes */}
            <Route path="/app" element={<AuthGuard><Layout /></AuthGuard>}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="send" element={<SendMoney />} />
              <Route path="receive" element={<ReceiveMoney />} />
              <Route path="topup" element={<TopUpWallet />} />
              <Route path="escrow" element={<Escrow />} />
              <Route path="community-finance" element={<CommunityFinance />} />
              <Route path="transactions" element={<TransactionHistory />} />
              <Route path="receipts" element={<DigitalReceipts />} />
              <Route path="payroll" element={<PayrollModule />} />
              <Route path="support" element={<Support />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App