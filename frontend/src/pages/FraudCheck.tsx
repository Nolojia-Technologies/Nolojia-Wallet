import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, CheckCircle, Search, ArrowLeft, Home, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function FraudCheck() {
  const navigate = useNavigate()
  const [userCode, setUserCode] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!userCode.trim()) return

    setIsLoading(true)
    // Mock API call
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
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
        <h1 className="text-3xl font-bold">Fraud Check Portal</h1>
        <p className="text-gray-600 mt-2">
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
                  <><Search className="mr-2 h-4 w-4" /> Search</>
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
      </div>
    </div>
  )
}