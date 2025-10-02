import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, CheckCircle, Search, ArrowLeft, Home, Wallet, CreditCard, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
// import { toast } from '@/components/ui/use-toast'

export default function FraudCheck() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [userCode, setUserCode] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')

  const FRAUD_CHECK_COST = 50 // 50 KES per check

  const handlePaymentRequired = () => {
    if (!userCode.trim()) return

    if (!isAuthenticated) {
      // Show payment modal for non-logged users
      setShowPayment(true)
    } else {
      // Check if user has sufficient balance
      const userBalance = (user as any)?.wallet?.balance || 0
      if (userBalance >= FRAUD_CHECK_COST) {
        // Deduct from wallet and proceed
        handleWalletDeduction()
      } else {
        // Show M-Pesa payment option for insufficient balance
        setShowPayment(true)
      }
    }
  }

  const handleWalletDeduction = async () => {
    setIsLoading(true)
    // Mock wallet deduction
    setTimeout(() => {
      // Update user balance (in real app, this would be done via API)
      const currentBalance = (user as any)?.wallet?.balance || 0
      const newBalance = currentBalance - FRAUD_CHECK_COST

      // Update the user's wallet balance (mock)
      if (user) {
        (user as any).wallet.balance = newBalance
      }

      performFraudCheck()
      // toast({
      //   title: "Payment Successful",
      //   description: `${formatCurrency(FRAUD_CHECK_COST)} deducted from your wallet`,
      // })
    }, 1000)
  }

  const handleMpesaPayment = async () => {
    // Validate phone number
    if (!phoneNumber.trim()) {
      alert('Please enter your phone number')
      return
    }

    const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      alert('Please enter a valid Kenyan phone number (e.g., 0712345678 or +254712345678)')
      return
    }

    setIsProcessingPayment(true)
    // Mock M-Pesa payment with STK push
    setTimeout(() => {
      setIsProcessingPayment(false)
      setShowPayment(false)
      setPhoneNumber('')
      performFraudCheck()
      alert(`Payment successful! STK push sent to ${phoneNumber}`)
      // toast({
      //   title: "Payment Successful",
      //   description: `Paid ${formatCurrency(FRAUD_CHECK_COST)} via M-Pesa to ${phoneNumber}`,
      // })
    }, 3000)
  }

  const performFraudCheck = () => {
    // Mock fraud check API call
    setTimeout(() => {
      // Mock response based on user code
      const mockResult = {
        userCode: userCode.toUpperCase(),
        trustScore: userCode.startsWith('T') ? 2.5 : userCode.startsWith('F') ? 1.0 : 4.8,
        status: userCode.startsWith('T') ? 'FLAGGED' : userCode.startsWith('F') ? 'BLACKLISTED' : 'CLEAN',
        isVerified: !userCode.startsWith('F'),
        reportsCount: userCode.startsWith('T') ? 3 : userCode.startsWith('F') ? 8 : 0,
        joinDate: '2023-08-15',
        badges: userCode.startsWith('F') ? ['High Risk'] : userCode.startsWith('T') ? ['Under Review'] : ['Verified User']
      }
      setSearchResult(mockResult)
      setIsLoading(false)
    }, 1500)
  }

  const handleSearch = () => {
    handlePaymentRequired()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CLEAN': return 'text-green-600 bg-green-100'
      case 'FLAGGED': return 'text-yellow-600 bg-yellow-100'
      case 'BLACKLISTED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CLEAN': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'FLAGGED': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'BLACKLISTED': return <Shield className="h-5 w-5 text-red-600" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      {/* Navigation Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Left: Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:block">Back</span>
            </Button>

            {/* Center: Logo and Title */}
            <div className="flex items-center space-x-2">
              <div className="bg-kenya-red p-1.5 rounded-lg">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">Nolojia Wallet</span>
            </div>

            {/* Right: Home Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:block">Home</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="text-center">
        <div className="bg-kenya-red p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fraud Check Portal</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Verify user trust scores and check for fraud reports
        </p>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Check User Status</CardTitle>
          <CardDescription>
            Enter a user code to check their trust score and fraud status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userCode">User Code</Label>
            <div className="flex space-x-2">
              <Input
                id="userCode"
                placeholder="Enter 8-character user code (e.g., AB12CD34)"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="uppercase font-mono"
              />
              <Button
                onClick={handleSearch}
                disabled={!userCode.trim() || isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <><Search className="mr-2 h-4 w-4" /> Check ({formatCurrency(FRAUD_CHECK_COST)})</>
                )}
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p><strong>Test codes:</strong></p>
            <p>• Use any code starting with 'T' to see a flagged user</p>
            <p>• Use any code starting with 'F' to see a blacklisted user</p>
            <p>• Use any other code to see a clean user</p>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      {searchResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(searchResult.status)}
                  <span>User Verification Result</span>
                </CardTitle>
                <CardDescription>User Code: {searchResult.userCode}</CardDescription>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(searchResult.status)}`}>
                {searchResult.status}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trust Score */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Trust Score</span>
                <span className="text-2xl font-bold">{searchResult.trustScore}/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    searchResult.trustScore >= 4 ? 'bg-green-500' : 
                    searchResult.trustScore >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(searchResult.trustScore / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Verification Status</p>
                <p className="font-medium">
                  {searchResult.isVerified ? '✅ Verified' : '❌ Not Verified'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Fraud Reports</p>
                <p className="font-medium">{searchResult.reportsCount} reports</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-medium">{searchResult.joinDate}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Status Badges</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {searchResult.badges.map((badge: string, index: number) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className={`p-4 rounded-lg border-l-4 ${
              searchResult.status === 'CLEAN' ? 'bg-green-50 border-green-500' :
              searchResult.status === 'FLAGGED' ? 'bg-yellow-50 border-yellow-500' :
              'bg-red-50 border-red-500'
            }`}>
              <h4 className="font-semibold mb-1">Recommendation</h4>
              <p className="text-sm">
                {searchResult.status === 'CLEAN' && 
                  "✅ This user has a clean record and can be trusted for transactions."}
                {searchResult.status === 'FLAGGED' && 
                  "⚠️ This user has been flagged. Exercise caution and consider additional verification."}
                {searchResult.status === 'BLACKLISTED' && 
                  "❌ This user is blacklisted. Do not proceed with any transactions."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Tool</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• <strong>Law Enforcement:</strong> Use this tool to verify users during investigations</p>
          <p>• <strong>Businesses:</strong> Check customer trust scores before high-value transactions</p>
          <p>• <strong>Individuals:</strong> Verify someone before making a purchase or sale</p>
          <p>• <strong>Report Fraud:</strong> If you encounter fraud, report it through your wallet app</p>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <div className="bg-kenya-red p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Required</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {!isAuthenticated
                  ? "Pay to perform fraud check"
                  : "Insufficient wallet balance"}
              </p>
            </div>

            <div className="mb-6">
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">Amount to pay</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(FRAUD_CHECK_COST)}</p>
              </div>
            </div>

            {isAuthenticated && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Insufficient Balance</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Current balance: {formatCurrency((user as any)?.wallet?.balance || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="e.g., 0712345678 or +254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter your M-Pesa registered phone number
                </p>
              </div>

              <Button
                onClick={handleMpesaPayment}
                disabled={isProcessingPayment || !phoneNumber.trim()}
                className="w-full"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay via M-Pesa
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowPayment(false)}
                disabled={isProcessingPayment}
                className="w-full"
              >
                Cancel
              </Button>
            </div>

            <div className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
              <p>Secure payment powered by M-Pesa</p>
              <p>You will receive an SMS prompt to complete payment</p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}