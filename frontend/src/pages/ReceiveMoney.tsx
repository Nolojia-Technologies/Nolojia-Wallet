import { useState } from 'react'
import { QrCode, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'

export default function ReceiveMoney() {
  const { user } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [copied, setCopied] = useState(false)

  // Mock user data for demo purposes
  const mockUser = {
    firstName: 'Demo',
    lastName: 'User',
    phone: '+254712345678',
    userCode: 'DEMO1234'
  }

  const displayUser = user || mockUser

  const handleCopyUserCode = async () => {
    if (displayUser?.userCode) {
      await navigator.clipboard.writeText(displayUser.userCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyPhone = async () => {
    if (displayUser?.phone) {
      await navigator.clipboard.writeText(displayUser.phone)
    }
  }

  // Mock QR code data URL
  const qrCodeUrl = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UVIgQ29kZTwvdGV4dD4KICA8dGV4dCB4PSIxMDAiIHk9IjEyMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtc2l6ZT0iMTIiPiR7dXNlcj8udXNlckNvZGV9PC90ZXh0Pgo8L3N2Zz4K`

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* QR Code Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Receive Money</span>
          </CardTitle>
          <CardDescription>
            Share your QR code or user details to receive payments
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
            <img
              src={qrCodeUrl}
              alt="Payment QR Code"
              className="w-48 h-48 mx-auto"
            />
          </div>

          {/* User Details */}
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <Label className="text-sm text-gray-600">User Code</Label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-lg font-bold">{displayUser?.userCode}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUserCode}
                  className="p-1"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <Label className="text-sm text-gray-600">Phone Number</Label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium">{displayUser?.phone}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPhone}
                  className="p-1"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <Label className="text-sm text-gray-600">Name</Label>
              <div className="mt-1">
                <span className="font-medium">
                  {displayUser?.firstName} {displayUser?.lastName}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Request Card */}
      <Card>
        <CardHeader>
          <CardTitle>Request Payment</CardTitle>
          <CardDescription>
            Generate a payment request with specific amount
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Payment for services"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={!amount}>
            Generate Payment Request
          </Button>

          {amount && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Payment request for <strong>KES {parseFloat(amount).toLocaleString()}</strong>
                {description && (
                  <>
                    <br />
                    <em>"{description}"</em>
                  </>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No payment requests yet</p>
            <p className="text-sm">Create your first payment request above</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}