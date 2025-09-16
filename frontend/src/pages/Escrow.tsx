import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Lock, Shield, CheckCircle, AlertCircle, Clock, Eye, Upload, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreateEscrowForm {
  sellerId: string
  amount: number
  itemDescription: string
  itemSerialNumber?: string
  itemImeiNumber?: string
  deliveryAddress: string
  pin: string
}

interface EscrowTransaction {
  id: string
  buyerId: string
  sellerId: string
  amount: number
  itemDescription: string
  itemSerialNumber?: string
  itemImeiNumber?: string
  status: 'CREATED' | 'FUNDED' | 'CONFIRMED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED' | 'EXPIRED'
  trackingNumber?: string
  deliveryAddress: string
  expiresAt?: Date
  releasedAt?: Date
  createdAt: Date
  itemImages?: string[]
}

const mockEscrowTransactions: EscrowTransaction[] = [
  {
    id: '1',
    buyerId: 'buyer1',
    sellerId: '+254712345678',
    amount: 25000,
    itemDescription: 'iPhone 13 Pro 256GB',
    itemSerialNumber: 'F2LMED1X0D6L',
    itemImeiNumber: '352046814696731',
    status: 'FUNDED',
    deliveryAddress: '123 Kenyatta Avenue, Nairobi',
    createdAt: new Date('2024-01-15'),
    expiresAt: new Date('2024-01-22'),
  },
  {
    id: '2',
    buyerId: 'buyer1',
    sellerId: '+254723456789',
    amount: 15000,
    itemDescription: 'Samsung Galaxy A54',
    status: 'CONFIRMED',
    trackingNumber: 'TRK123456789',
    deliveryAddress: '456 Uhuru Highway, Mombasa',
    createdAt: new Date('2024-01-10'),
    releasedAt: new Date('2024-01-18'),
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CREATED': return 'text-gray-600'
    case 'FUNDED': return 'text-blue-600'
    case 'CONFIRMED': return 'text-yellow-600'
    case 'RELEASED': return 'text-green-600'
    case 'DISPUTED': return 'text-red-600'
    case 'REFUNDED': return 'text-orange-600'
    case 'EXPIRED': return 'text-gray-500'
    default: return 'text-gray-600'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'CREATED': return <Clock className="h-4 w-4" />
    case 'FUNDED': return <Shield className="h-4 w-4" />
    case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />
    case 'RELEASED': return <CheckCircle className="h-4 w-4" />
    case 'DISPUTED': return <AlertCircle className="h-4 w-4" />
    case 'REFUNDED': return <AlertCircle className="h-4 w-4" />
    case 'EXPIRED': return <X className="h-4 w-4" />
    default: return <Clock className="h-4 w-4" />
  }
}

export default function Escrow() {
  const [activeTab, setActiveTab] = useState<'create' | 'transactions'>('create')
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [escrowTransactions] = useState<EscrowTransaction[]>(mockEscrowTransactions)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CreateEscrowForm>()

  const formData = watch()

  const onSubmit = async (data: CreateEscrowForm) => {
    console.log('Create escrow:', data, 'Images:', selectedImages)
    setStep('confirm')
  }

  const confirmEscrow = async () => {
    setStep('success')
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedImages(prev => [...prev, ...files].slice(0, 5)) // Max 5 images
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const startNewEscrow = () => {
    setStep('form')
    setSelectedImages([])
    reset()
  }

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Lock className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Escrow Created Successfully!</CardTitle>
            <CardDescription>
              Your escrow transaction has been created and is awaiting funding
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Item</p>
              <p className="font-medium">{formData.itemDescription}</p>
              <p className="text-2xl font-bold mt-2">KES {formData.amount?.toLocaleString()}</p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Seller:</strong> {formData.sellerId}</p>
              <p><strong>Delivery Address:</strong> {formData.deliveryAddress}</p>
              {formData.itemSerialNumber && (
                <p><strong>Serial Number:</strong> {formData.itemSerialNumber}</p>
              )}
              {formData.itemImeiNumber && (
                <p><strong>IMEI Number:</strong> {formData.itemImeiNumber}</p>
              )}
            </div>
            <Button onClick={startNewEscrow} className="w-full">
              Create Another Escrow
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Confirm Escrow Transaction</CardTitle>
            <CardDescription>Please review the details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-gray-600">Item Description</p>
                <p className="font-medium">{formData.itemDescription}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seller:</span>
                <span className="font-medium">{formData.sellerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">KES {formData.amount?.toLocaleString()}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivery Address</p>
                <p className="font-medium">{formData.deliveryAddress}</p>
              </div>
              {formData.itemSerialNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Serial Number:</span>
                  <span className="font-medium">{formData.itemSerialNumber}</span>
                </div>
              )}
              {formData.itemImeiNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">IMEI Number:</span>
                  <span className="font-medium">{formData.itemImeiNumber}</span>
                </div>
              )}
              {selectedImages.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Item Images ({selectedImages.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedImages.map((_, index) => (
                      <div key={index} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500">Image {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Escrow Fee:</span>
                <span className="font-medium">KES 50.00</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total to Pay:</span>
                <span>KES {(formData.amount + 50)?.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <Shield className="h-4 w-4 inline mr-1" />
                Your money will be held securely until you confirm receipt of the item
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                Back
              </Button>
              <Button onClick={confirmEscrow} className="flex-1">
                Create & Fund Escrow
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-kenya-red text-kenya-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Escrow
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-kenya-red text-kenya-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Escrows ({escrowTransactions.length})
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Create Escrow Transaction</span>
              </CardTitle>
              <CardDescription>
                Secure your purchase with our escrow protection service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sellerId">Seller Phone Number</Label>
                  <Input
                    id="sellerId"
                    placeholder="+254712345678"
                    {...register('sellerId', {
                      required: 'Seller phone number is required',
                      pattern: {
                        value: /^\+254[17]\d{8}$/,
                        message: 'Enter a valid Kenyan phone number',
                      },
                    })}
                  />
                  {errors.sellerId && (
                    <p className="text-sm text-red-600">{errors.sellerId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Purchase Amount (KES)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="25000"
                    min="100"
                    {...register('amount', {
                      required: 'Amount is required',
                      min: {
                        value: 100,
                        message: 'Minimum amount is KES 100',
                      },
                      max: {
                        value: 500000,
                        message: 'Maximum amount is KES 500,000',
                      },
                    })}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemDescription">Item Description</Label>
                  <Input
                    id="itemDescription"
                    placeholder="iPhone 13 Pro 256GB Space Gray"
                    {...register('itemDescription', {
                      required: 'Item description is required',
                      minLength: {
                        value: 10,
                        message: 'Description must be at least 10 characters',
                      },
                    })}
                  />
                  {errors.itemDescription && (
                    <p className="text-sm text-red-600">{errors.itemDescription.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Input
                    id="deliveryAddress"
                    placeholder="123 Kenyatta Avenue, Nairobi"
                    {...register('deliveryAddress', {
                      required: 'Delivery address is required',
                    })}
                  />
                  {errors.deliveryAddress && (
                    <p className="text-sm text-red-600">{errors.deliveryAddress.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemSerialNumber">Serial Number (Optional)</Label>
                  <Input
                    id="itemSerialNumber"
                    placeholder="F2LMED1X0D6L"
                    {...register('itemSerialNumber')}
                  />
                  <p className="text-xs text-gray-500">For phones, electronics, etc.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemImeiNumber">IMEI Number (Optional)</Label>
                  <Input
                    id="itemImeiNumber"
                    placeholder="352046814696731"
                    {...register('itemImeiNumber', {
                      pattern: {
                        value: /^\d{15}$/,
                        message: 'IMEI must be 15 digits',
                      },
                    })}
                  />
                  {errors.itemImeiNumber && (
                    <p className="text-sm text-red-600">{errors.itemImeiNumber.message}</p>
                  )}
                  <p className="text-xs text-gray-500">For mobile phones only</p>
                </div>

                <div className="space-y-2">
                  <Label>Item Images (Optional, max 5)</Label>
                  <div className="flex items-center space-x-2">
                    <label className="flex-1">
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button type="button" variant="outline" className="w-full" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Images
                        </span>
                      </Button>
                    </label>
                  </div>
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-500">{image.name.substring(0, 10)}...</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">Transaction PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter your PIN"
                    maxLength={4}
                    {...register('pin', {
                      required: 'Transaction PIN is required',
                      pattern: {
                        value: /^\d{4}$/,
                        message: 'PIN must be 4 digits',
                      },
                    })}
                  />
                  {errors.pin && (
                    <p className="text-sm text-red-600">{errors.pin.message}</p>
                  )}
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Escrow fee: KES 50. Your funds are protected until delivery confirmation.
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  Create Escrow Transaction
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Escrow Transactions</h2>
          </div>

          {escrowTransactions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No escrow transactions yet</p>
                <Button
                  onClick={() => setActiveTab('create')}
                  className="mt-4"
                  variant="outline"
                >
                  Create Your First Escrow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {escrowTransactions.map((escrow) => (
                <Card key={escrow.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{escrow.itemDescription}</CardTitle>
                      <div className={`flex items-center space-x-1 ${getStatusColor(escrow.status)}`}>
                        {getStatusIcon(escrow.status)}
                        <span className="text-sm font-medium">{escrow.status}</span>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      Seller: {escrow.sellerId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold">KES {escrow.amount.toLocaleString()}</span>
                    </div>

                    {escrow.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking:</span>
                        <span className="font-mono text-sm">{escrow.trackingNumber}</span>
                      </div>
                    )}

                    <div className="text-sm text-gray-600">
                      <p>Delivery: {escrow.deliveryAddress}</p>
                    </div>

                    {escrow.itemSerialNumber && (
                      <div className="text-sm">
                        <span className="text-gray-600">Serial: </span>
                        <span className="font-mono">{escrow.itemSerialNumber}</span>
                      </div>
                    )}

                    {escrow.itemImeiNumber && (
                      <div className="text-sm">
                        <span className="text-gray-600">IMEI: </span>
                        <span className="font-mono">{escrow.itemImeiNumber}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Created: {escrow.createdAt.toLocaleDateString()}
                      {escrow.expiresAt && (
                        <span> • Expires: {escrow.expiresAt.toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      {escrow.status === 'CONFIRMED' && (
                        <Button size="sm" className="flex-1">
                          Release Funds
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}