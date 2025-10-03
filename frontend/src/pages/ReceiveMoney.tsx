import { useState, useEffect } from 'react'
import { QrCode, Copy, Check, Download, Share2, User, Phone, Hash, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import QRCode from 'qrcode'

export default function ReceiveMoney() {
  const { user } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [paymentQrCode, setPaymentQrCode] = useState('')

  // Mock user data for demo purposes - each user has unique code
  const mockUser = {
    id: 'user_001',
    firstName: 'Demo',
    lastName: 'User',
    phone: '+254712345678',
    email: 'demo@nolojia.com',
    userCode: 'NOLJ' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    walletBalance: 25000
  }

  const displayUser = user || mockUser

  // Generate unique QR code for user
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrData = JSON.stringify({
          userCode: displayUser?.userCode,
          name: `${displayUser?.firstName} ${displayUser?.lastName}`,
          phone: displayUser?.phone,
          type: 'receive'
        })

        const url = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#DC2626', // Kenya red color
            light: '#FFFFFF'
          }
        })
        setQrCodeDataUrl(url)
      } catch (err) {
        console.error('Error generating QR code:', err)
      }
    }

    if (displayUser) {
      generateQRCode()
    }
  }, [displayUser])

  // Generate payment request QR code
  useEffect(() => {
    const generatePaymentQR = async () => {
      if (amount && parseFloat(amount) > 0) {
        try {
          const paymentData = JSON.stringify({
            userCode: displayUser?.userCode,
            name: `${displayUser?.firstName} ${displayUser?.lastName}`,
            phone: displayUser?.phone,
            amount: parseFloat(amount),
            description: description || 'Payment request',
            type: 'payment_request'
          })

          const url = await QRCode.toDataURL(paymentData, {
            width: 250,
            margin: 2,
            color: {
              dark: '#DC2626',
              light: '#FFFFFF'
            }
          })
          setPaymentQrCode(url)
        } catch (err) {
          console.error('Error generating payment QR:', err)
        }
      } else {
        setPaymentQrCode('')
      }
    }

    generatePaymentQR()
  }, [amount, description, displayUser])

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleDownloadQR = () => {
    const link = document.createElement('a')
    link.download = `${displayUser?.userCode}_qr_code.png`
    link.href = qrCodeDataUrl
    link.click()
  }

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Payment QR Code',
          text: `Send money to ${displayUser?.firstName} ${displayUser?.lastName}\nUser Code: ${displayUser?.userCode}\nPhone: ${displayUser?.phone}`,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Receive Money</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Share your unique QR code or user details to receive payments instantly
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center space-x-2 text-lg sm:text-xl">
              <QrCode className="h-5 w-5" />
              <span>Your Unique QR Code</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Scan to send money directly to your wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {/* QR Code */}
            <div className="bg-white dark:bg-white p-4 sm:p-6 rounded-xl border-2 border-muted inline-block mx-auto">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Payment QR Code"
                  className="w-48 h-48 sm:w-64 sm:h-64 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-muted-foreground animate-pulse" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQR}
                className="flex-1 sm:flex-initial"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareQR}
                className="flex-1 sm:flex-initial"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Details Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">Your Payment Details</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Share these details to receive payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* User Code */}
            <div className="bg-muted/50 dark:bg-muted/20 p-3 sm:p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs sm:text-sm text-muted-foreground">User Code</Label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-lg sm:text-2xl font-bold text-foreground">
                  {displayUser?.userCode}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(displayUser?.userCode || '', 'userCode')}
                  className="flex-shrink-0"
                >
                  {copiedField === 'userCode' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Phone Number */}
            <div className="bg-muted/50 dark:bg-muted/20 p-3 sm:p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs sm:text-sm text-muted-foreground">Phone Number</Label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-base sm:text-lg text-foreground">
                  {displayUser?.phone}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(displayUser?.phone || '', 'phone')}
                  className="flex-shrink-0"
                >
                  {copiedField === 'phone' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Full Name */}
            <div className="bg-muted/50 dark:bg-muted/20 p-3 sm:p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs sm:text-sm text-muted-foreground">Account Name</Label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-base sm:text-lg text-foreground">
                  {displayUser?.firstName} {displayUser?.lastName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(`${displayUser?.firstName} ${displayUser?.lastName}`, 'name')}
                  className="flex-shrink-0"
                >
                  {copiedField === 'name' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Wallet Balance (Optional) */}
            <div className="bg-gradient-to-r from-kenya-red to-red-600 p-3 sm:p-4 rounded-lg text-white">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-white/80" />
                <Label className="text-xs sm:text-sm text-white/80">Current Balance</Label>
              </div>
              <div className="text-xl sm:text-2xl font-bold">
                KES {displayUser?.walletBalance?.toLocaleString() || '0'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Request Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Generate Payment Request</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Create a QR code with a specific amount for someone to pay you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Payment for services, products, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-300 font-medium">
                    Payment Request Created:
                  </p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-1">
                    KES {parseFloat(amount).toLocaleString()}
                  </p>
                  {description && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 italic">
                      "{description}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Payment QR Code */}
            <div className="flex flex-col items-center justify-center space-y-4">
              {paymentQrCode ? (
                <>
                  <div className="bg-white dark:bg-white p-4 rounded-xl border-2 border-muted">
                    <img
                      src={paymentQrCode}
                      alt="Payment Request QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.download = `payment_request_${amount}_KES.png`
                        link.href = paymentQrCode
                        link.click()
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (navigator.share) {
                          await navigator.share({
                            title: 'Payment Request',
                            text: `Please pay KES ${amount}${description ? ` for ${description}` : ''}\nUser Code: ${displayUser?.userCode}`,
                          })
                        }
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <QrCode className="h-16 w-16 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Enter an amount to generate payment QR code</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="bg-muted/50 dark:bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl">How to Receive Money</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col items-center text-center p-3 bg-background rounded-lg">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mb-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <p className="font-medium text-foreground">Share Your QR Code</p>
              <p className="text-xs text-muted-foreground mt-1">
                Let the sender scan your unique QR code
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-background rounded-lg">
              <div className="h-10 w-10 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-2">
                <span className="text-green-600 dark:text-green-400 font-bold">2</span>
              </div>
              <p className="font-medium text-foreground">Or Share User Code</p>
              <p className="text-xs text-muted-foreground mt-1">
                Provide your unique user code for manual entry
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-background rounded-lg">
              <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950 rounded-full flex items-center justify-center mb-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
              </div>
              <p className="font-medium text-foreground">Receive Instantly</p>
              <p className="text-xs text-muted-foreground mt-1">
                Money appears in your wallet immediately
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
