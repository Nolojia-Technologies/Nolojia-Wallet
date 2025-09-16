import { useState } from 'react'
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState('')
  // const [filterType, setFilterType] = useState('all')

  // Mock transaction data
  const transactions = [
    {
      id: '1',
      type: 'TRANSFER',
      amount: -2500,
      description: 'Payment to John Doe',
      date: '2024-01-15T10:30:00Z',
      status: 'COMPLETED',
      reference: 'TXN123456789'
    },
    {
      id: '2',
      type: 'DEPOSIT',
      amount: 10000,
      description: 'M-Pesa deposit',
      date: '2024-01-14T14:20:00Z',
      status: 'COMPLETED',
      reference: 'TXN123456788'
    },
    {
      id: '3',
      type: 'ESCROW_CREATE',
      amount: -15000,
      description: 'Escrow for iPhone purchase',
      date: '2024-01-13T09:15:00Z',
      status: 'PENDING',
      reference: 'TXN123456787'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-gray-600 mt-1">View all your wallet transactions</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest wallet activity</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
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
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.reference}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}
                    KES {Math.abs(transaction.amount).toLocaleString()}
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
  )
}