import { useState } from 'react'
import { Receipt, Search, Download, Eye, QrCode } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function DigitalReceipts() {
  const [searchTerm, setSearchTerm] = useState('')

  // Mock receipts data
  const receipts = [
    {
      id: '1',
      receiptNumber: 'RCP1641234567890ABC',
      sellerName: 'Mary Electronics',
      buyerName: 'John Buyer',
      items: [
        {
          name: 'iPhone 12 Pro Max',
          description: '256GB Space Gray',
          quantity: 1,
          unitPrice: 120000,
          serialNumber: 'F2LLD8UDPPHF'
        }
      ],
      totalAmount: 120000,
      date: '2024-01-15T10:30:00Z',
      isVerified: true,
      isFlagged: false
    },
    {
      id: '2',
      receiptNumber: 'RCP1641234567890XYZ',
      sellerName: 'Tech Solutions',
      buyerName: 'Jane Smith',
      items: [
        {
          name: 'Samsung Galaxy S23',
          description: '128GB Phantom Black',
          quantity: 1,
          unitPrice: 85000
        }
      ],
      totalAmount: 85000,
      date: '2024-01-10T14:20:00Z',
      isVerified: true,
      isFlagged: false
    }
  ]

  const filteredReceipts = receipts.filter(receipt => 
    receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Digital Receipts</h1>
        <p className="text-gray-600 mt-1">View and manage your digital transaction receipts</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search receipts by number, seller, or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Receipt className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{receipts.length}</p>
                <p className="text-sm text-gray-600">Total Receipts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <QrCode className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{receipts.filter(r => r.isVerified).length}</p>
                <p className="text-sm text-gray-600">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">!</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{receipts.filter(r => r.isFlagged).length}</p>
                <p className="text-sm text-gray-600">Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Receipts</CardTitle>
          <CardDescription>
            All your digital transaction receipts with QR verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length > 0 ? (
            <div className="space-y-4">
              {filteredReceipts.map((receipt) => (
                <div key={receipt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{receipt.receiptNumber}</h3>
                        {receipt.isVerified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            ✓ Verified
                          </span>
                        )}
                        {receipt.isFlagged && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            ! Flagged
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(receipt.date).toLocaleDateString()} at {new Date(receipt.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">KES {receipt.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-gray-600">Seller</p>
                      <p className="font-medium">{receipt.sellerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Buyer</p>
                      <p className="font-medium">{receipt.buyerName}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Items:</p>
                    <div className="space-y-1">
                      {receipt.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.name}</span>
                            <span>KES {item.unitPrice.toLocaleString()}</span>
                          </div>
                          <p className="text-gray-600">{item.description}</p>
                          {(item as any).serialNumber && (
                            <p className="text-gray-600 font-mono text-xs">
                              S/N: {(item as any).serialNumber}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-1 h-3 w-3" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <QrCode className="mr-1 h-3 w-3" />
                      Show QR
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-1 h-3 w-3" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No receipts found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'Your digital receipts will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Digital Receipts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• <strong>Tamper-Proof:</strong> All receipts are digitally signed and cannot be modified</p>
          <p>• <strong>QR Verification:</strong> Each receipt has a unique QR code for instant verification</p>
          <p>• <strong>Police Access:</strong> Law enforcement can verify receipts to combat fraud</p>
          <p>• <strong>Permanent Record:</strong> Receipts are stored permanently for your protection</p>
          <p>• <strong>Export Options:</strong> Download receipts as PDF for your records</p>
        </CardContent>
      </Card>
    </div>
  )
}