import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Send,
  QrCode,
  ArrowUpRight,
  Wallet2,
  Building2,
  Smartphone,
  Shield,
  Receipt,
  Copy,
  CheckCircle,
  AlertTriangle,
  Banknote,
  Share2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'

// Types
interface WalletTransferForm {
  recipientPhone: string
  recipientWalletId: string
  amount: number
  description: string
  pin: string
}

interface WithdrawalForm {
  destination: 'mpesa' | 'airtel' | 'bank'
  recipientPhone: string
  bankDetails?: {
    accountNumber: string
    bankName: string
  }
  amount: number
  pin: string
}

interface DigitalReceipt {
  id: string
  type: 'WALLET_TRANSFER' | 'WITHDRAWAL'
  amount: number
  recipient: string
  description: string
  timestamp: Date
  transactionId: string
  fees: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  blockchainHash?: string
}

export default function SendMoney() {
  const [activeTab, setActiveTab] = useState<'wallet' | 'withdraw'>('wallet')
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [receipt, setReceipt] = useState<DigitalReceipt | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  // Form hooks for each type
  const walletForm = useForm<WalletTransferForm>()
  const withdrawalForm = useForm<WithdrawalForm>()

  const generateTransactionId = () => {
    return 'TXN' + Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const generateBlockchainHash = () => {
    return '0x' + Math.random().toString(16).substring(2, 42)
  }

  const calculateFees = (amount: number, type: string) => {
    switch (type) {
      case 'wallet': return 0 // Free wallet-to-wallet
      case 'mpesa': return Math.max(10, amount * 0.02) // 2% or minimum KES 10
      case 'airtel': return Math.max(15, amount * 0.025) // 2.5% or minimum KES 15
      case 'bank': return 50 // Flat KES 50 for bank transfers
      default: return 0
    }
  }

  // Wallet Transfer Functions
  const handleWalletTransfer = async (data: WalletTransferForm) => {
    const fees = calculateFees(data.amount, 'wallet')
    const newReceipt: DigitalReceipt = {
      id: Math.random().toString(36),
      type: 'WALLET_TRANSFER',
      amount: data.amount,
      recipient: data.recipientPhone || data.recipientWalletId,
      description: data.description,
      timestamp: new Date(),
      transactionId: generateTransactionId(),
      fees,
      status: 'COMPLETED',
      blockchainHash: generateBlockchainHash()
    }
    setReceipt(newReceipt)
    setStep('confirm')
  }

  const confirmWalletTransfer = () => {
    setStep('success')
  }

  // Withdrawal Functions
  const handleWithdrawal = async (data: WithdrawalForm) => {
    const fees = calculateFees(data.amount, data.destination)
    const recipient = data.destination === 'bank'
      ? `${data.bankDetails?.bankName} - ${data.bankDetails?.accountNumber}`
      : data.recipientPhone

    const newReceipt: DigitalReceipt = {
      id: Math.random().toString(36),
      type: 'WITHDRAWAL',
      amount: data.amount,
      recipient,
      description: `Withdrawal to ${data.destination.toUpperCase()}`,
      timestamp: new Date(),
      transactionId: generateTransactionId(),
      fees,
      status: 'PENDING', // Withdrawals are typically pending
    }
    setReceipt(newReceipt)
    setStep('confirm')
  }

  const confirmWithdrawal = () => {
    if (receipt) {
      setReceipt({ ...receipt, status: 'COMPLETED' })
    }
    setStep('success')
  }


  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const startNewTransaction = () => {
    setStep('form')
    setReceipt(null)
    walletForm.reset()
    withdrawalForm.reset()
  }

  const shareReceipt = () => {
    if (receipt) {
      const shareText = `Nolojia Wallet Transaction
Transaction ID: ${receipt.transactionId}
Amount: ${formatCurrency(receipt.amount)}
To: ${receipt.recipient}
Time: ${receipt.timestamp.toLocaleString()}
Blockchain: ${receipt.blockchainHash || 'Processing...'}
#NolojiaWallet #DigitalReceipt`

      if (navigator.share) {
        navigator.share({ title: 'Transaction Receipt', text: shareText })
      } else {
        copyToClipboard(shareText, 'receipt')
      }
    }
  }

  // Success Screen
  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Transaction Successful!</CardTitle>
            <CardDescription>
              Your {receipt?.type.toLowerCase().replace('_', ' ')} has been completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {receipt && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{receipt.transactionId}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(receipt.transactionId, 'transactionId')}
                        className="h-6 w-6 p-0"
                      >
                        {copiedField === 'transactionId' ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-lg">{formatCurrency(receipt.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{receipt.recipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-medium">{formatCurrency(receipt.fees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{receipt.timestamp.toLocaleString()}</span>
                  </div>
                  {receipt.blockchainHash && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blockchain:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs">{receipt.blockchainHash.substring(0, 10)}...</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(receipt.blockchainHash!, 'blockchainHash')}
                          className="h-6 w-6 p-0"
                        >
                          {copiedField === 'blockchainHash' ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Fraud Protection</h4>
                      <p className="text-sm text-blue-800">
                        This transaction is protected by blockchain verification and can be traced.
                        Keep this receipt for your records.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={shareReceipt} className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Receipt
                  </Button>
                  <Button onClick={startNewTransaction} className="flex-1">
                    Send Again
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Confirmation Screen
  if (step === 'confirm') {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Confirm Transaction</CardTitle>
            <CardDescription>Please review the details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {receipt && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{receipt.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{receipt.recipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{formatCurrency(receipt.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-medium">{formatCurrency(receipt.fees)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(receipt.amount + receipt.fees)}</span>
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Please verify all details are correct. This transaction cannot be reversed.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={receipt.type === 'WALLET_TRANSFER' ? confirmWalletTransfer : confirmWithdrawal}
                    className="flex-1"
                  >
                    Confirm & Send
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Form
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
        <p className="text-gray-600 mt-1">Choose how you want to send money</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wallet" className="flex items-center space-x-2">
            <Wallet2 className="h-4 w-4" />
            <span className="hidden sm:block">Wallet Transfer</span>
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="flex items-center space-x-2">
            <ArrowUpRight className="h-4 w-4" />
            <span className="hidden sm:block">Withdraw</span>
          </TabsTrigger>
        </TabsList>

        {/* Wallet-to-Wallet Transfer */}
        <TabsContent value="wallet">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet2 className="h-5 w-5 text-green-600" />
                  <span>Wallet-to-Wallet Transfer</span>
                </CardTitle>
                <CardDescription>
                  Send money instantly to another Nolojia Wallet user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={walletForm.handleSubmit(handleWalletTransfer)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone">Recipient Phone Number</Label>
                    <Input
                      id="recipientPhone"
                      placeholder="+254712345678"
                      {...walletForm.register('recipientPhone', {
                        required: 'Recipient phone number is required',
                        pattern: {
                          value: /^\+254[17]\d{8}$/,
                          message: 'Enter a valid Kenyan phone number',
                        },
                      })}
                    />
                    {walletForm.formState.errors.recipientPhone && (
                      <p className="text-sm text-red-600">{walletForm.formState.errors.recipientPhone.message}</p>
                    )}
                  </div>

                  <div className="text-center text-gray-500">OR</div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientWalletId">Wallet ID</Label>
                    <Input
                      id="recipientWalletId"
                      placeholder="NW123456789"
                      {...walletForm.register('recipientWalletId')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="1000"
                      min="10"
                      {...walletForm.register('amount', {
                        required: 'Amount is required',
                        min: { value: 10, message: 'Minimum amount is KES 10' },
                        max: { value: 100000, message: 'Maximum amount is KES 100,000' },
                      })}
                    />
                    {walletForm.formState.errors.amount && (
                      <p className="text-sm text-red-600">{walletForm.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Payment for services"
                      {...walletForm.register('description')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pin">Transaction PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      placeholder="Enter your PIN"
                      maxLength={4}
                      {...walletForm.register('pin', {
                        required: 'Transaction PIN is required',
                        pattern: { value: /^\d{4}$/, message: 'PIN must be 4 digits' },
                      })}
                    />
                    {walletForm.formState.errors.pin && (
                      <p className="text-sm text-red-600">{walletForm.formState.errors.pin.message}</p>
                    )}
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        <strong>Free transfer</strong> • Instant delivery • Digital receipt
                      </span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send Money
                  </Button>

                  <div className="text-center">
                    <Button variant="outline" size="sm" type="button">
                      <QrCode className="mr-2 h-4 w-4" />
                      Scan QR Code
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-green-800">Why Use Wallet Transfers?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Banknote className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">No Fees</h4>
                    <p className="text-sm text-gray-600">Free transfers between Nolojia Wallet users</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Instant</h4>
                    <p className="text-sm text-gray-600">Money arrives immediately</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Receipt className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Digital Receipt</h4>
                    <p className="text-sm text-gray-600">Blockchain-verified transaction records</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Trust Building</h4>
                    <p className="text-sm text-gray-600">Builds your trust score for future transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Withdrawal/Bridge */}
        <TabsContent value="withdraw">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ArrowUpRight className="h-5 w-5 text-blue-600" />
                  <span>Withdraw to External Account</span>
                </CardTitle>
                <CardDescription>
                  Send money to M-Pesa, Airtel Money, or bank accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={withdrawalForm.handleSubmit(handleWithdrawal)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={withdrawalForm.watch('destination') === 'mpesa' ? 'default' : 'outline'}
                        onClick={() => withdrawalForm.setValue('destination', 'mpesa')}
                        className="flex flex-col items-center p-3 h-auto"
                      >
                        <Smartphone className="h-5 w-5 mb-1" />
                        <span className="text-xs">M-Pesa</span>
                      </Button>
                      <Button
                        type="button"
                        variant={withdrawalForm.watch('destination') === 'airtel' ? 'default' : 'outline'}
                        onClick={() => withdrawalForm.setValue('destination', 'airtel')}
                        className="flex flex-col items-center p-3 h-auto"
                      >
                        <Smartphone className="h-5 w-5 mb-1" />
                        <span className="text-xs">Airtel</span>
                      </Button>
                      <Button
                        type="button"
                        variant={withdrawalForm.watch('destination') === 'bank' ? 'default' : 'outline'}
                        onClick={() => withdrawalForm.setValue('destination', 'bank')}
                        className="flex flex-col items-center p-3 h-auto"
                      >
                        <Building2 className="h-5 w-5 mb-1" />
                        <span className="text-xs">Bank</span>
                      </Button>
                    </div>
                  </div>

                  {withdrawalForm.watch('destination') !== 'bank' && (
                    <div className="space-y-2">
                      <Label htmlFor="recipientPhone">Phone Number</Label>
                      <Input
                        id="recipientPhone"
                        placeholder="+254712345678"
                        {...withdrawalForm.register('recipientPhone', {
                          required: 'Phone number is required',
                          pattern: {
                            value: /^\+254[17]\d{8}$/,
                            message: 'Enter a valid Kenyan phone number',
                          },
                        })}
                      />
                      {withdrawalForm.formState.errors.recipientPhone && (
                        <p className="text-sm text-red-600">{withdrawalForm.formState.errors.recipientPhone.message}</p>
                      )}
                    </div>
                  )}

                  {withdrawalForm.watch('destination') === 'bank' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          placeholder="1234567890"
                          {...withdrawalForm.register('bankDetails.accountNumber', {
                            required: 'Account number is required',
                          })}
                        />
                        {withdrawalForm.formState.errors.bankDetails?.accountNumber && (
                          <p className="text-sm text-red-600">{withdrawalForm.formState.errors.bankDetails.accountNumber.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="Equity Bank"
                          {...withdrawalForm.register('bankDetails.bankName', {
                            required: 'Bank name is required',
                          })}
                        />
                        {withdrawalForm.formState.errors.bankDetails?.bankName && (
                          <p className="text-sm text-red-600">{withdrawalForm.formState.errors.bankDetails.bankName.message}</p>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="500"
                      min="50"
                      {...withdrawalForm.register('amount', {
                        required: 'Amount is required',
                        min: { value: 50, message: 'Minimum withdrawal is KES 50' },
                        max: { value: 50000, message: 'Maximum withdrawal is KES 50,000' },
                      })}
                    />
                    {withdrawalForm.formState.errors.amount && (
                      <p className="text-sm text-red-600">{withdrawalForm.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pin">Transaction PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      placeholder="Enter your PIN"
                      maxLength={4}
                      {...withdrawalForm.register('pin', {
                        required: 'Transaction PIN is required',
                        pattern: { value: /^\d{4}$/, message: 'PIN must be 4 digits' },
                      })}
                    />
                    {withdrawalForm.formState.errors.pin && (
                      <p className="text-sm text-red-600">{withdrawalForm.formState.errors.pin.message}</p>
                    )}
                  </div>

                  {withdrawalForm.watch('amount') && withdrawalForm.watch('destination') && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Amount:</span>
                        <span>{formatCurrency(withdrawalForm.watch('amount'))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Fee:</span>
                        <span>{formatCurrency(calculateFees(withdrawalForm.watch('amount'), withdrawalForm.watch('destination')))}</span>
                      </div>
                      <hr className="my-1" />
                      <div className="flex justify-between font-semibold text-sm">
                        <span>Total Deducted:</span>
                        <span>{formatCurrency(withdrawalForm.watch('amount') + calculateFees(withdrawalForm.watch('amount'), withdrawalForm.watch('destination')))}</span>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Withdraw Money
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Withdrawal Info */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Withdrawal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">M-Pesa:</span>
                    <span className="text-sm font-medium">2% (min KES 10)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Airtel Money:</span>
                    <span className="text-sm font-medium">2.5% (min KES 15)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Bank Transfer:</span>
                    <span className="text-sm font-medium">Flat KES 50</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600">
                    <strong>Processing Time:</strong><br />
                    • M-Pesa/Airtel: 1-5 minutes<br />
                    • Bank: 1-24 hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}