import { useState } from 'react'
import { Coins, Users, DollarSign, TrendingUp, CalendarCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCommunityFinanceStore } from '@/store/communityFinanceStore'
import { formatCurrency } from '@/lib/utils'
import ChamaSection from '@/components/community-finance/ChamaSection'
import P2PLendingSection from '@/components/community-finance/P2PLendingSection'

export default function CommunityFinance() {
  const [activeTab, setActiveTab] = useState<'chama' | 'p2p'>('chama')
  const { chamas, loans, loanRequests } = useCommunityFinanceStore()

  // Mock current user
  const currentUserId = 'u1'

  // Calculate statistics
  const userChamas = chamas.filter(chama =>
    chama.members.some(member => member.id === currentUserId) || chama.createdBy === currentUserId
  )

  const userLoans = loans.filter(loan =>
    loan.borrowerId === currentUserId || loan.lenderId === currentUserId
  )

  const totalChamaSavings = userChamas.reduce((sum, chama) => {
    // Calculate actual user contributions across all their chamas
    const userContributions = chama.members
      .filter(member => member.id === currentUserId)
      .reduce((memberSum, member) => memberSum + member.totalContributions, 0)
    return sum + userContributions
  }, 0)
  const activeLoans = userLoans.filter(loan => loan.status === 'active').length
  const pendingRequests = loanRequests.filter(req => req.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Coins className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Community Finance</h1>
        </div>
        <p className="text-gray-600">
          Join Chamas for group savings or participate in peer-to-peer lending
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">My Chamas</p>
                <p className="text-xl font-bold">{userChamas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Savings</p>
                <p className="text-xl font-bold">{formatCurrency(totalChamaSavings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Active Loans</p>
                <p className="text-xl font-bold">{activeLoans}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarCheck className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Loan Requests</p>
                <p className="text-xl font-bold">{pendingRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chama" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Chama (Group Savings)</span>
          </TabsTrigger>
          <TabsTrigger value="p2p" className="flex items-center space-x-2">
            <Coins className="h-4 w-4" />
            <span>P2P Lending</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chama">
          <ChamaSection currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="p2p">
          <P2PLendingSection currentUserId={currentUserId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}