import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Globe,
  QrCode,
  ArrowLeft,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

type PaymentMethod = 'mpesa' | 'card' | 'bank' | 'crypto' | 'paypal' | 'ussd' | null

export default function TopUpWallet() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuthStore()

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null)
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionDetails, setTransactionDetails] = useState<any>(null)

  const paymentMethods = [
    {
      id: 'mpesa' as PaymentMethod,
      title: 'M-Pesa',
      description: 'Pay via M-Pesa mobile money',
      icon: Smartphone,
      color: 'bg-green-500',
      available: true,
    },
    {
      id: 'card' as PaymentMethod,
      title: 'Card Payment',
      description: 'Debit/Credit card',
      icon: CreditCard,
      color: 'bg-blue-500',
      available: true,
    },
    {
      id: 'bank' as PaymentMethod,
      title: 'Bank Transfer',
      description: 'Direct bank transfer',
      icon: Building2,
      color: 'bg-purple-500',
      available: true,
    },
    {
      id: 'crypto' as PaymentMethod,
      title: 'Cryptocurrency',
      description: 'Bitcoin, Ethereum, USDT',
      icon: Wallet,
      color: 'bg-orange-500',
      available: true,
    },
    {
      id: 'paypal' as PaymentMethod,
      title: 'PayPal',
      description: 'Pay with PayPal',
      icon: Globe,
      color: 'bg-indigo-500',
      available: true,
    },
    {
      id: 'ussd' as PaymentMethod,
      title: 'USSD Code',
      description: 'Dial USSD code',
      icon: QrCode,
      color: 'bg-gray-600',
      available: true,
    },
  ]

  const quickAmounts = [1000, 2500, 5000, 10000, 25000, 50000]

  const handleTopUp = async () => {
    if (!selectedMethod) {
      toast({
        title: 'Payment method required',
        description: 'Please select a payment method',
        variant: 'destructive',
      })
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      })
      return
    }

    if (selectedMethod === 'mpesa' && !phoneNumber) {
      toast({
        title: 'Phone number required',
        description: 'Please enter your M-Pesa phone number',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)

    try {
      // Simulate API call for payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate transaction details based on payment method
      const details = generateTransactionDetails(selectedMethod, parseFloat(amount))
      setTransactionDetails(details)

      toast({
        title: 'Payment initiated',
        description: getPaymentInitiationMessage(selectedMethod),
      })
    } catch (error) {
      toast({
        title: 'Payment failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const generateTransactionDetails = (method: PaymentMethod, amount: number) => {
    const baseDetails = {
      transactionId: `TXN${Date.now()}`,
      amount,
      fee: amount * 0.015, // 1.5% transaction fee
      total: amount * 1.015,
      currency: 'KES',
      status: 'PENDING',
      timestamp: new Date().toISOString(),
    }

    switch (method) {
      case 'mpesa':
        return {
          ...baseDetails,
          instructions: [
            `An M-Pesa prompt has been sent to ${phoneNumber}`,
            'Enter your M-Pesa PIN to complete the transaction',
            'You will receive an SMS confirmation once complete',
          ],
          reference: `NLJ${Date.now().toString().slice(-6)}`,
        }

      case 'card':
        return {
          ...baseDetails,
          paymentUrl: 'https://pay.nolojia.com/secure-checkout',
          instructions: [
            'Click the button below to proceed to secure checkout',
            'Enter your card details on the payment page',
            'Complete 3D Secure verification if prompted',
          ],
        }

      case 'bank':
        return {
          ...baseDetails,
          bankDetails: {
            accountName: 'Nolojia Wallet Ltd',
            accountNumber: '0123456789',
            bankName: 'Kenya Commercial Bank',
            branchCode: '091',
            swiftCode: 'KCBLKENX',
            reference: `NLJ${user?.userCode || 'DEMO'}${Date.now().toString().slice(-6)}`,
          },
          instructions: [
            'Transfer the exact amount to the account below',
            'Use the reference number provided',
            'Your wallet will be credited within 5-10 minutes after confirmation',
          ],
        }

      case 'crypto':
        return {
          ...baseDetails,
          cryptoDetails: {
            btcAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            ethAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
            usdtAddress: 'TN4rKxNqVmtYknQdNzsJdN1z3GQvWPWWxp',
            network: 'Select appropriate network for your transfer',
            exchangeRate: 'Current market rate applies',
          },
          instructions: [
            'Send cryptocurrency to one of the addresses above',
            'Include transaction hash for faster processing',
            'Allow 3-6 confirmations for credit to reflect',
          ],
        }

      case 'paypal':
        return {
          ...baseDetails,
          paypalEmail: 'payments@nolojia.com',
          paymentUrl: 'https://paypal.me/nolojiawallet',
          instructions: [
            'Click the PayPal button to proceed',
            'Log in to your PayPal account',
            'Confirm the payment amount and complete transaction',
          ],
        }

      case 'ussd':
        return {
          ...baseDetails,
          ussdCode: '*234*1*1#',
          instructions: [
            `Dial ${' *234*1*1# '} on your phone`,
            'Select option 1 for Wallet Top-up',
            `Enter reference: ${user?.userCode || 'DEMO1234'}`,
            `Enter amount: ${formatCurrency(amount)}`,
            'Enter your PIN to confirm',
          ],
        }

      default:
        return baseDetails
    }
  }

  const getPaymentInitiationMessage = (method: PaymentMethod) => {
    switch (method) {
      case 'mpesa':
        return 'Check your phone for the M-Pesa prompt'
      case 'card':
        return 'Redirecting to secure payment page...'
      case 'bank':
        return 'Bank transfer details generated'
      case 'crypto':
        return 'Crypto wallet addresses generated'
      case 'paypal':
        return 'PayPal payment link ready'
      case 'ussd':
        return 'USSD code ready. Dial now to complete'
      default:
        return 'Payment initiated successfully'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Top Up Wallet</h1>
          <p className="text-gray-600">Add funds to your Nolojia wallet</p>
        </div>
      </div>

      {!transactionDetails ? (
        <>
          {/* Amount Input */}
          <Card>
            <CardHeader>
              <CardTitle>Enter Amount</CardTitle>
              <CardDescription>
                How much would you like to add to your wallet?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl font-bold"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    {formatCurrency(quickAmount)}
                  </Button>
                ))}
              </div>

              {amount && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Amount:</span>
                    <span>{formatCurrency(parseFloat(amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Transaction Fee (1.5%):</span>
                    <span>{formatCurrency((parseFloat(amount) || 0) * 0.015)}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatCurrency((parseFloat(amount) || 0) * 1.015)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
              <CardDescription>
                Choose how you'd like to fund your wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <div
                      key={method.id}
                      onClick={() => method.available && setSelectedMethod(method.id)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${selectedMethod === method.id
                          ? 'border-kenya-red bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                        ${!method.available && 'opacity-50 cursor-not-allowed'}
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`${method.color} p-2 rounded-lg`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{method.title}</h3>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                        {selectedMethod === method.id && (
                          <Check className="h-5 w-5 text-kenya-red" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* M-Pesa Phone Number */}
              {selectedMethod === 'mpesa' && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Enter the phone number registered with M-Pesa
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proceed Button */}
          <Button
            onClick={handleTopUp}
            disabled={!selectedMethod || !amount || isProcessing}
            className="w-full h-12 text-lg"
          >
            {isProcessing ? 'Processing...' : `Top Up ${formatCurrency(parseFloat(amount) || 0)}`}
          </Button>
        </>
      ) : (
        /* Transaction Details */
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Payment</CardTitle>
            <CardDescription>
              Transaction ID: {transactionDetails.transactionId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  {transactionDetails.instructions.map((instruction: string, index: number) => (
                    <p key={index} className="text-sm">{instruction}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Bank Transfer Details */}
            {selectedMethod === 'bank' && transactionDetails.bankDetails && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold">Bank Account Details</h3>
                {Object.entries(transactionDetails.bankDetails).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{value as string}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(value as string)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Crypto Addresses */}
            {selectedMethod === 'crypto' && transactionDetails.cryptoDetails && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold">Cryptocurrency Addresses</h3>
                {Object.entries(transactionDetails.cryptoDetails).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <span className="text-sm text-gray-600">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs break-all">{value as string}</span>
                      {key.includes('Address') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(value as string)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* USSD Code */}
            {selectedMethod === 'ussd' && transactionDetails.ussdCode && (
              <div className="p-4 bg-gray-900 text-white rounded-lg text-center">
                <p className="text-sm mb-2">Dial this code on your phone:</p>
                <p className="text-3xl font-bold font-mono">{transactionDetails.ussdCode}</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => copyToClipboard(transactionDetails.ussdCode)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            )}

            {/* Payment URL */}
            {(selectedMethod === 'card' || selectedMethod === 'paypal') && transactionDetails.paymentUrl && (
              <Button
                className="w-full"
                onClick={() => window.open(transactionDetails.paymentUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Proceed to Secure Payment
              </Button>
            )}

            {/* Transaction Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Transaction Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>{formatCurrency(transactionDetails.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee:</span>
                  <span>{formatCurrency(transactionDetails.fee)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(transactionDetails.total)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setTransactionDetails(null)
                  setSelectedMethod(null)
                  setAmount('')
                  setPhoneNumber('')
                }}
                className="flex-1"
              >
                New Transaction
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}