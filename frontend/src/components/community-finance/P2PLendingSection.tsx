import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Bell,
  Zap,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useCommunityFinanceStore, type Loan } from '@/store/communityFinanceStore'
import { formatCurrency } from '@/lib/utils'

interface P2PLendingSectionProps {
  currentUserId: string
}

interface BorrowForm {
  amount: number
  purpose: string
  repaymentPeriod: number
  interestRate: number
}

interface LenderForm {
  amount: number
  interestRate: number
  duration: number
  lateFeePercentage: number
  gracePeriodDays: number
  additionalTerms: string
}

interface FilterOptions {
  minAmount: number
  maxAmount: number
  minTrustScore: number
  maxRepaymentPeriod: number
  purpose: string
}

function NotificationCenter({ currentUserId }: { currentUserId: string }) {
  const { loans } = useCommunityFinanceStore()

  const userLoans = loans.filter(loan =>
    loan.borrowerId === currentUserId || loan.lenderId === currentUserId
  )

  const notifications = userLoans
    .filter(loan => {
      const repaymentDate = new Date(loan.repaymentDate)
      const today = new Date()
      const daysDiff = Math.ceil((repaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Show notifications for loans due within 3 days or overdue
      return daysDiff <= 3 && loan.status === 'active'
    })
    .map(loan => {
      const repaymentDate = new Date(loan.repaymentDate)
      const today = new Date()
      const daysDiff = Math.ceil((repaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...loan,
        daysDiff,
        isOverdue: daysDiff < 0,
        priority: daysDiff < 0 ? 'high' : daysDiff <= 1 ? 'medium' : 'low'
      }
    })

  if (notifications.length === 0) return null

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-900">Repayment Notifications</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${
                notification.isOverdue
                  ? 'bg-red-50 border-red-200'
                  : notification.daysDiff <= 1
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {notification.borrowerId === currentUserId
                      ? `Repay ${formatCurrency(notification.repaymentAmount)} to ${notification.lenderName}`
                      : `${notification.borrowerName} owes you ${formatCurrency(notification.repaymentAmount)}`
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {notification.isOverdue
                      ? `Overdue by ${Math.abs(notification.daysDiff)} days`
                      : notification.daysDiff === 0
                      ? 'Due today'
                      : `Due in ${notification.daysDiff} days`
                    }
                  </p>
                </div>
                {notification.borrowerId === currentUserId && (
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    <Zap className="w-3 h-3 mr-1" />
                    Auto-Pay
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LoanMarketplace({ currentUserId, filters }: { currentUserId: string, filters: FilterOptions }) {
  const { loanRequests, lenderOfferings, fundLoan, takeLenderOffering } = useCommunityFinanceStore()
  const [marketplaceTab, setMarketplaceTab] = useState<'borrowers' | 'lenders'>('borrowers')

  const filteredRequests = loanRequests
    .filter(request =>
      request.status === 'pending' &&
      request.borrowerId !== currentUserId &&
      request.amount >= filters.minAmount &&
      request.amount <= filters.maxAmount &&
      request.trustScore >= filters.minTrustScore &&
      request.repaymentPeriod <= filters.maxRepaymentPeriod &&
      (filters.purpose === '' || request.purpose.toLowerCase().includes(filters.purpose.toLowerCase()))
    )
    .sort((a, b) => b.trustScore - a.trustScore) // Sort by trust score descending

  const filteredOfferings = lenderOfferings
    .filter(offering =>
      offering.status === 'available' &&
      offering.lenderId !== currentUserId &&
      offering.amount >= filters.minAmount &&
      offering.amount <= filters.maxAmount &&
      offering.duration <= filters.maxRepaymentPeriod &&
      (filters.purpose === '' || offering.additionalTerms.toLowerCase().includes(filters.purpose.toLowerCase()))
    )
    .sort((a, b) => a.interestRate - b.interestRate) // Sort by interest rate ascending (best deals first)

  const handleFundLoan = (requestId: string) => {
    fundLoan(requestId, currentUserId, 'John Doe') // In real app, get name from auth store
  }

  const handleTakeLoan = (offeringId: string) => {
    const purpose = prompt('Please enter the purpose for this loan:')
    if (purpose) {
      takeLenderOffering(offeringId, currentUserId, 'John Doe', purpose) // In real app, get name from auth store
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600'
    if (score >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskLevel = (score: number) => {
    if (score >= 4.5) return { level: 'Low Risk', color: 'bg-green-100 text-green-800' }
    if (score >= 3.5) return { level: 'Medium Risk', color: 'bg-yellow-100 text-yellow-800' }
    return { level: 'High Risk', color: 'bg-red-100 text-red-800' }
  }

  return (
    <div className="space-y-4">
      {/* Marketplace Tabs */}
      <Tabs value={marketplaceTab} onValueChange={(value: any) => setMarketplaceTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="borrowers">Borrower Requests ({filteredRequests.length})</TabsTrigger>
          <TabsTrigger value="lenders">Lender Offerings ({filteredOfferings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="borrowers">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No borrower requests match your filters</p>
                <p className="text-sm text-gray-500">Try adjusting your filter criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((request) => {
                const risk = getRiskLevel(request.trustScore)
                const repaymentDate = new Date(request.repaymentDate)
                const requestDate = new Date(request.requestDate)
                const daysAgo = Math.floor((Date.now() - requestDate.getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <Card key={request.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className={risk.color}>
                          {risk.level}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                        </span>
                      </div>
                      <CardTitle className="text-lg">
                        {formatCurrency(request.amount)}
                      </CardTitle>
                      <CardDescription>
                        Requested by {request.borrowerName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Trust Score:</span>
                        <span className={`font-semibold ${getTrustScoreColor(request.trustScore)}`}>
                          {request.trustScore}/5.0
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="font-semibold text-green-600">
                          {request.interestRate}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Repayment:</span>
                        <span className="font-semibold">
                          {request.repaymentPeriod} days
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2 rounded text-sm">
                        <p className="font-medium mb-1">Purpose:</p>
                        <p className="text-gray-600">{request.purpose}</p>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleFundLoan(request.id)}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Fund This Request
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lenders">
          {filteredOfferings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No lender offerings match your filters</p>
                <p className="text-sm text-gray-500">Try adjusting your filter criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOfferings.map((offering) => {
                const createdDate = new Date(offering.createdAt)
                const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                const totalRepayment = offering.amount * (1 + offering.interestRate / 100)

                return (
                  <Card key={offering.id} className="hover:shadow-lg transition-shadow border-green-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Available
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                        </span>
                      </div>
                      <CardTitle className="text-lg text-green-700">
                        {formatCurrency(offering.amount)}
                      </CardTitle>
                      <CardDescription>
                        Offered by {offering.lenderName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="font-semibold text-green-600">
                          {offering.interestRate}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold">
                          {offering.duration} days
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Late Fee:</span>
                        <span className="font-semibold text-orange-600">
                          {offering.penalties.lateFeePercentage}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Grace Period:</span>
                        <span className="font-semibold">
                          {offering.penalties.gracePeriodDays} days
                        </span>
                      </div>

                      {offering.additionalTerms && (
                        <div className="bg-gray-50 p-2 rounded text-sm">
                          <p className="font-medium mb-1">Terms:</p>
                          <p className="text-gray-600 text-xs">{offering.additionalTerms}</p>
                        </div>
                      )}

                      <div className="bg-blue-50 p-2 rounded text-sm">
                        <p className="font-medium text-blue-900">
                          Total repayment: {formatCurrency(totalRepayment)}
                        </p>
                      </div>

                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleTakeLoan(offering.id)}
                      >
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Take This Loan
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LoanDashboard({ currentUserId }: { currentUserId: string }) {
  const { loans, repayLoan } = useCommunityFinanceStore()

  const userLoans = {
    borrowed: loans.filter(loan => loan.borrowerId === currentUserId),
    lent: loans.filter(loan => loan.lenderId === currentUserId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" />Active</Badge>
      case 'repaid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Repaid</Badge>
      case 'defaulted':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Defaulted</Badge>
      case 'late':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><AlertTriangle className="w-3 h-3 mr-1" />Late</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getDaysRemaining = (repaymentDate: string) => {
    const date = new Date(repaymentDate)
    const today = new Date()
    const timeDiff = date.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysDiff
  }

  const handleRepayLoan = (loanId: string) => {
    repayLoan(loanId)
  }

  const calculateStats = (loansList: Loan[]) => {
    const total = loansList.reduce((sum, loan) => sum + loan.amount, 0)
    const active = loansList.filter(loan => loan.status === 'active').length
    const completed = loansList.filter(loan => loan.status === 'repaid').length
    return { total, active, completed }
  }

  const borrowedStats = calculateStats(userLoans.borrowed)
  const lentStats = calculateStats(userLoans.lent)

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Borrowed</p>
                <p className="text-lg font-bold">{formatCurrency(borrowedStats.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Lent</p>
                <p className="text-lg font-bold">{formatCurrency(lentStats.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Loans</p>
                <p className="text-lg font-bold">{borrowedStats.active + lentStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-lg font-bold">{borrowedStats.completed + lentStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="borrowed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="borrowed">Borrowed Loans ({userLoans.borrowed.length})</TabsTrigger>
          <TabsTrigger value="lent">Lent Money ({userLoans.lent.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="borrowed">
          <div className="space-y-4">
            {userLoans.borrowed.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600">You haven't borrowed any money yet</p>
                </CardContent>
              </Card>
            ) : (
              userLoans.borrowed.map((loan) => {
                const daysRemaining = getDaysRemaining(loan.repaymentDate)
                const isOverdue = daysRemaining < 0

                return (
                  <Card key={loan.id} className={isOverdue ? 'border-red-200 bg-red-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {formatCurrency(loan.amount)}
                            </h3>
                            {getStatusBadge(loan.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Lender: {loan.lenderName}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            Purpose: {loan.purpose}
                          </p>
                          <p className="text-sm text-gray-600">
                            Interest: {loan.interestRate}% •
                            Repayment: {formatCurrency(loan.repaymentAmount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {isOverdue ? `Overdue by ${Math.abs(daysRemaining)} days` :
                             daysRemaining === 0 ? 'Due today' :
                             `${daysRemaining} days left`}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            Due: {new Date(loan.repaymentDate).toLocaleDateString()}
                          </p>
                          {loan.status === 'active' && (
                            <div className="space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleRepayLoan(loan.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Repay Now
                              </Button>
                              <Button size="sm" variant="outline">
                                <Zap className="w-3 h-3 mr-1" />
                                Auto-Pay
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="lent">
          <div className="space-y-4">
            {userLoans.lent.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600">You haven't lent any money yet</p>
                </CardContent>
              </Card>
            ) : (
              userLoans.lent.map((loan) => {
                const daysRemaining = getDaysRemaining(loan.repaymentDate)
                const isOverdue = daysRemaining < 0

                return (
                  <Card key={loan.id} className={isOverdue ? 'border-red-200 bg-red-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {formatCurrency(loan.amount)}
                            </h3>
                            {getStatusBadge(loan.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Borrower: {loan.borrowerName}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            Purpose: {loan.purpose}
                          </p>
                          <p className="text-sm text-gray-600">
                            Interest: {loan.interestRate}% •
                            Expected return: {formatCurrency(loan.repaymentAmount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                            {isOverdue ? `Overdue by ${Math.abs(daysRemaining)} days` :
                             daysRemaining === 0 ? 'Due today' :
                             `${daysRemaining} days left`}
                          </p>
                          <p className="text-sm text-gray-600">
                            Due: {new Date(loan.repaymentDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LendMoneySection({ currentUserId }: { currentUserId: string }) {
  const { createLenderOffering, getWalletBalance, getUserLenderOfferings, updateLenderOffering, deleteLenderOffering, validateAndCleanupOfferings } = useCommunityFinanceStore()
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<LenderForm>()
  const [editingOffering, setEditingOffering] = useState<string | null>(null)

  const walletBalance = getWalletBalance(currentUserId)
  const userOfferings = getUserLenderOfferings(currentUserId)
  const watchedAmount = watch('amount')

  // Validate and cleanup offerings when component loads
  useEffect(() => {
    validateAndCleanupOfferings(currentUserId)
  }, [currentUserId, validateAndCleanupOfferings])

  const onSubmitLend = (data: LenderForm) => {
    if (data.amount > walletBalance) {
      alert(`Cannot offer more than your wallet balance: ${formatCurrency(walletBalance)}`)
      return
    }

    if (editingOffering) {
      updateLenderOffering(editingOffering, {
        amount: data.amount,
        interestRate: data.interestRate,
        duration: data.duration,
        penalties: {
          lateFeePercentage: data.lateFeePercentage,
          gracePeriodDays: data.gracePeriodDays
        },
        additionalTerms: data.additionalTerms
      })
      setEditingOffering(null)
    } else {
      createLenderOffering({
        lenderId: currentUserId,
        lenderName: 'John Doe', // In real app, get from auth store
        amount: data.amount,
        interestRate: data.interestRate,
        duration: data.duration,
        penalties: {
          lateFeePercentage: data.lateFeePercentage,
          gracePeriodDays: data.gracePeriodDays
        },
        additionalTerms: data.additionalTerms
      })
    }

    reset()
  }

  const handleEdit = (offering: any) => {
    if (!offering.isEditable) {
      alert('Cannot edit offering that has already been lent out')
      return
    }

    setEditingOffering(offering.id)
    reset({
      amount: offering.amount,
      interestRate: offering.interestRate,
      duration: offering.duration,
      lateFeePercentage: offering.penalties.lateFeePercentage,
      gracePeriodDays: offering.penalties.gracePeriodDays,
      additionalTerms: offering.additionalTerms
    })
  }

  const handleDelete = (offeringId: string) => {
    if (confirm('Are you sure you want to delete this offering?')) {
      deleteLenderOffering(offeringId)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
      case 'lent':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Lent Out</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lend Money</h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">Wallet Balance</p>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(walletBalance)}</p>
        </div>
      </div>

      {/* Create/Edit Offering Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingOffering ? 'Edit Loan Offering' : 'Create Loan Offering'}</CardTitle>
          <CardDescription>
            Set your lending terms and conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitLend)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Lend (KES) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="25000"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 1000, message: 'Minimum amount is KES 1,000' },
                    max: { value: walletBalance, message: `Cannot exceed wallet balance: ${formatCurrency(walletBalance)}` }
                  })}
                />
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount.message}</p>
                )}
                {watchedAmount && watchedAmount > walletBalance && (
                  <p className="text-sm text-orange-600">
                    Warning: Amount exceeds wallet balance
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.1"
                  placeholder="12"
                  {...register('interestRate', {
                    required: 'Interest rate is required',
                    min: { value: 0.1, message: 'Minimum interest rate is 0.1%' },
                    max: { value: 30, message: 'Maximum interest rate is 30%' }
                  })}
                />
                {errors.interestRate && (
                  <p className="text-sm text-red-600">{errors.interestRate.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Loan Duration (days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="30"
                  {...register('duration', {
                    required: 'Duration is required',
                    min: { value: 7, message: 'Minimum duration is 7 days' },
                    max: { value: 365, message: 'Maximum duration is 365 days' }
                  })}
                />
                {errors.duration && (
                  <p className="text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lateFeePercentage">Late Fee (%) *</Label>
                <Input
                  id="lateFeePercentage"
                  type="number"
                  step="0.1"
                  placeholder="5"
                  {...register('lateFeePercentage', {
                    required: 'Late fee percentage is required',
                    min: { value: 0, message: 'Late fee cannot be negative' },
                    max: { value: 20, message: 'Maximum late fee is 20%' }
                  })}
                />
                {errors.lateFeePercentage && (
                  <p className="text-sm text-red-600">{errors.lateFeePercentage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gracePeriodDays">Grace Period (days) *</Label>
                <Input
                  id="gracePeriodDays"
                  type="number"
                  placeholder="3"
                  {...register('gracePeriodDays', {
                    required: 'Grace period is required',
                    min: { value: 0, message: 'Grace period cannot be negative' },
                    max: { value: 14, message: 'Maximum grace period is 14 days' }
                  })}
                />
                {errors.gracePeriodDays && (
                  <p className="text-sm text-red-600">{errors.gracePeriodDays.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalTerms">Additional Terms & Conditions</Label>
              <textarea
                id="additionalTerms"
                placeholder="Any additional terms, requirements, or conditions for borrowers..."
                rows={3}
                className="w-full p-3 border rounded-md resize-none"
                {...register('additionalTerms')}
              />
              <p className="text-xs text-gray-500">Optional: Add specific requirements or conditions</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-semibold text-green-900 mb-2">Lender Protection</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• All loans are tracked and monitored for repayment</li>
                <li>• Late fees are automatically calculated and applied</li>
                <li>• Borrower trust scores are updated based on payment history</li>
                <li>• You can edit terms until the loan is taken</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              {editingOffering && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingOffering(null)
                    reset()
                  }}
                  className="flex-1"
                >
                  Cancel Edit
                </Button>
              )}
              <Button type="submit" className="flex-1">
                <TrendingUp className="mr-2 h-4 w-4" />
                {editingOffering ? 'Update Offering' : 'Create Offering'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* My Offerings */}
      <Card>
        <CardHeader>
          <CardTitle>My Loan Offerings</CardTitle>
          <CardDescription>
            Manage your active and completed loan offerings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userOfferings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">You haven't created any loan offerings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userOfferings.map((offering) => (
                <div key={offering.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-lg">{formatCurrency(offering.amount)}</h3>
                      {getStatusBadge(offering.status)}
                    </div>
                    <div className="flex space-x-2">
                      {offering.isEditable && offering.status === 'available' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(offering)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(offering.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Interest Rate</p>
                      <p className="font-medium">{offering.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{offering.duration} days</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Late Fee</p>
                      <p className="font-medium">{offering.penalties.lateFeePercentage}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Grace Period</p>
                      <p className="font-medium">{offering.penalties.gracePeriodDays} days</p>
                    </div>
                  </div>

                  {offering.additionalTerms && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600 mb-1">Additional Terms:</p>
                      <p className="text-sm">{offering.additionalTerms}</p>
                    </div>
                  )}

                  {offering.borrowerName && (
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <p className="text-sm text-blue-800">
                        <strong>Borrowed by:</strong> {offering.borrowerName}
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>Loan Start:</strong> {offering.loanStartDate ? new Date(offering.loanStartDate).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>Due Date:</strong> {offering.repaymentDate ? new Date(offering.repaymentDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function P2PLendingSection({ currentUserId }: P2PLendingSectionProps) {
  const [activeView, setActiveView] = useState<'marketplace' | 'dashboard' | 'borrow' | 'lend'>('marketplace')
  const [filters, setFilters] = useState<FilterOptions>({
    minAmount: 0,
    maxAmount: 1000000,
    minTrustScore: 0,
    maxRepaymentPeriod: 365,
    purpose: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const { createLoanRequest } = useCommunityFinanceStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BorrowForm>()

  const onSubmitBorrow = (data: BorrowForm) => {
    const repaymentDate = new Date()
    repaymentDate.setDate(repaymentDate.getDate() + data.repaymentPeriod)

    createLoanRequest({
      ...data,
      borrowerId: currentUserId,
      borrowerName: 'John Doe', // In real app, get from auth store
      trustScore: 4.8, // In real app, get from user profile
      repaymentDate: repaymentDate.toISOString()
    })

    reset()
    setActiveView('marketplace')
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <NotificationCenter currentUserId={currentUserId} />

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-2 sm:gap-0">
          <Button
            variant={activeView === 'marketplace' ? 'default' : 'outline'}
            onClick={() => setActiveView('marketplace')}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Marketplace</span>
            <span className="sm:hidden">Market</span>
          </Button>
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveView('dashboard')}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">My Loans</span>
            <span className="sm:hidden">Loans</span>
          </Button>
          <Button
            variant={activeView === 'borrow' ? 'default' : 'outline'}
            onClick={() => setActiveView('borrow')}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Borrow Money</span>
            <span className="sm:hidden">Borrow</span>
          </Button>
          <Button
            variant={activeView === 'lend' ? 'default' : 'outline'}
            onClick={() => setActiveView('lend')}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Lend Money</span>
            <span className="sm:hidden">Lend</span>
          </Button>
        </div>

        {activeView === 'marketplace' && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs sm:text-sm px-2 sm:px-3 w-full sm:w-auto"
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Filters
          </Button>
        )}
      </div>

      {/* Filters */}
      {activeView === 'marketplace' && showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Loan Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Min Amount (KES)</Label>
                <Input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Amount (KES)</Label>
                <Input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Trust Score</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={filters.minTrustScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, minTrustScore: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Repayment Days</Label>
                <Input
                  type="number"
                  value={filters.maxRepaymentPeriod}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxRepaymentPeriod: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label>Purpose</Label>
              <Input
                placeholder="Search by purpose..."
                value={filters.purpose}
                onChange={(e) => setFilters(prev => ({ ...prev, purpose: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content based on active view */}
      {activeView === 'marketplace' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Loan Marketplace</h2>
          <LoanMarketplace currentUserId={currentUserId} filters={filters} />
        </div>
      )}

      {activeView === 'dashboard' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">My Loans Dashboard</h2>
          <LoanDashboard currentUserId={currentUserId} />
        </div>
      )}

      {activeView === 'borrow' && (
        <Card>
          <CardHeader>
            <CardTitle>Request a Loan</CardTitle>
            <CardDescription>
              Create a loan request for other users to fund
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmitBorrow)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Loan Amount (KES) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="10000"
                    {...register('amount', {
                      required: 'Loan amount is required',
                      min: { value: 1000, message: 'Minimum loan amount is KES 1,000' }
                    })}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repaymentPeriod">Repayment Period (days) *</Label>
                  <Input
                    id="repaymentPeriod"
                    type="number"
                    placeholder="30"
                    {...register('repaymentPeriod', {
                      required: 'Repayment period is required',
                      min: { value: 7, message: 'Minimum repayment period is 7 days' },
                      max: { value: 365, message: 'Maximum repayment period is 365 days' }
                    })}
                  />
                  {errors.repaymentPeriod && (
                    <p className="text-sm text-red-600">{errors.repaymentPeriod.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Input
                  id="purpose"
                  placeholder="e.g., Medical emergency, Business inventory, School fees"
                  {...register('purpose', { required: 'Purpose is required' })}
                />
                {errors.purpose && (
                  <p className="text-sm text-red-600">{errors.purpose.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.1"
                  placeholder="10"
                  {...register('interestRate', {
                    required: 'Interest rate is required',
                    min: { value: 0, message: 'Interest rate cannot be negative' },
                    max: { value: 30, message: 'Maximum interest rate is 30%' }
                  })}
                />
                {errors.interestRate && (
                  <p className="text-sm text-red-600">{errors.interestRate.message}</p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-900 mb-2">Loan Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your trust score affects loan approval chances</li>
                  <li>• Late payments will negatively impact your trust score</li>
                  <li>• Be realistic with repayment periods</li>
                  <li>• Provide clear purpose to attract lenders</li>
                </ul>
              </div>

              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Loan Request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeView === 'lend' && (
        <LendMoneySection currentUserId={currentUserId} />
      )}
    </div>
  )
}