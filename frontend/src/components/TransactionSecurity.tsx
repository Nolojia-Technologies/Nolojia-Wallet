import { useState, useEffect } from 'react'
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { verifyPin, hashPin, generateSecurePin } from '@/lib/encryption'
import { secureStorage } from '@/services/secureStorage'
import { formatCurrency } from '@/lib/utils'

interface TransactionSecurityProps {
  isOpen: boolean
  onClose: () => void
  onVerified: (pin: string) => Promise<void>
  transactionDetails: {
    type: 'send' | 'withdraw' | 'payment' | 'loan'
    amount: number
    recipient?: string
    description?: string
  }
  requireBiometric?: boolean
}

export function TransactionSecurity({
  isOpen,
  onClose,
  onVerified,
  transactionDetails,
  requireBiometric = false
}: TransactionSecurityProps) {
  const [pin, setPin] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTime, setLockTime] = useState(0)
  const [showDetails, setShowDetails] = useState(true)

  const MAX_ATTEMPTS = 3
  const LOCK_DURATION = 300000 // 5 minutes

  useEffect(() => {
    // Check if user is locked out
    const checkLockStatus = async () => {
      const lockInfo = await secureStorage.getSecure<{ until: number }>('pin_lock')
      if (lockInfo && lockInfo.until > Date.now()) {
        setIsLocked(true)
        setLockTime(lockInfo.until - Date.now())

        const timer = setInterval(() => {
          const remaining = lockInfo.until - Date.now()
          if (remaining <= 0) {
            setIsLocked(false)
            setLockTime(0)
            clearInterval(timer)
          } else {
            setLockTime(remaining)
          }
        }, 1000)

        return () => clearInterval(timer)
      }
    }

    checkLockStatus()
  }, [])

  const handlePinSubmit = async () => {
    if (pin.length !== 6) {
      setError('PIN must be 6 digits')
      return
    }

    if (isLocked) {
      setError(`Too many attempts. Try again in ${Math.ceil(lockTime / 60000)} minutes`)
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      // Get stored PIN hash from secure storage
      const storedPinData = await secureStorage.getSecure<{ hash: string; salt: string }>('user_pin')

      if (!storedPinData) {
        setError('PIN not set. Please set up your PIN in settings.')
        setIsVerifying(false)
        return
      }

      // Verify PIN
      const isValid = await verifyPin(pin, storedPinData.hash, storedPinData.salt)

      if (isValid) {
        // Log successful transaction verification
        await logSecurityEvent('transaction_verified', {
          type: transactionDetails.type,
          amount: transactionDetails.amount,
          timestamp: Date.now()
        })

        // Call the verification callback
        await onVerified(pin)

        // Reset state
        setPin('')
        setAttempts(0)
        onClose()
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= MAX_ATTEMPTS) {
          // Lock the user out
          const lockUntil = Date.now() + LOCK_DURATION
          await secureStorage.setSecure('pin_lock', { until: lockUntil })
          setIsLocked(true)
          setLockTime(LOCK_DURATION)

          await logSecurityEvent('pin_locked', {
            attempts: newAttempts,
            lockedUntil: lockUntil
          })

          setError('Too many incorrect attempts. Account locked for 5 minutes.')
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining`)
        }
      }
    } catch (error) {
      console.error('PIN verification failed:', error)
      setError('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
      if (!isValid) setPin('')
    }
  }

  const logSecurityEvent = async (event: string, details: any) => {
    const events = await secureStorage.getSecure<any[]>('security_events') || []
    events.push({
      event,
      details,
      timestamp: Date.now()
    })
    // Keep only last 100 events
    const recentEvents = events.slice(-100)
    await secureStorage.setSecure('security_events', recentEvents)
  }

  const formatLockTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getTransactionIcon = () => {
    switch (transactionDetails.type) {
      case 'send':
        return '💸'
      case 'withdraw':
        return '🏦'
      case 'payment':
        return '💳'
      case 'loan':
        return '💰'
      default:
        return '📱'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !isVerifying && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-kenya-red" />
            <DialogTitle>Transaction Verification</DialogTitle>
          </div>
          <DialogDescription>
            Enter your 6-digit PIN to authorize this transaction
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Details */}
        {showDetails && (
          <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Transaction Details</span>
                <span className="text-2xl">{getTransactionIcon()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-medium capitalize">{transactionDetails.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-bold text-lg text-kenya-green">
                  {formatCurrency(transactionDetails.amount)}
                </span>
              </div>
              {transactionDetails.recipient && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">To:</span>
                  <span className="font-medium">{transactionDetails.recipient}</span>
                </div>
              )}
              {transactionDetails.description && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {transactionDetails.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* PIN Input */}
        <div className="space-y-4">
          {isLocked ? (
            <Alert className="border-red-200 bg-red-50">
              <Lock className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Account locked. Try again in {formatLockTime(lockTime)}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="pin">Enter PIN</Label>
                <div className="flex space-x-2">
                  {[...Array(6)].map((_, i) => (
                    <Input
                      key={i}
                      type="password"
                      maxLength={1}
                      className="w-12 h-12 text-center text-lg font-bold"
                      value={pin[i] || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^\d*$/.test(value)) {
                          const newPin = pin.split('')
                          newPin[i] = value
                          setPin(newPin.join(''))

                          // Auto-focus next input
                          if (value && i < 5) {
                            const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement
                            nextInput?.focus()
                          }

                          // Auto-submit when complete
                          if (newPin.join('').length === 6) {
                            handlePinSubmit()
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !pin[i] && i > 0) {
                          const prevInput = e.target.parentElement?.children[i - 1] as HTMLInputElement
                          prevInput?.focus()
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {requireBiometric && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Simulate biometric authentication
                    console.log('Biometric authentication requested')
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Use Biometric Authentication
                </Button>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isVerifying}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handlePinSubmit}
            disabled={isVerifying || isLocked || pin.length !== 6}
          >
            {isVerifying ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify
              </>
            )}
          </Button>
        </div>

        {/* Security Tips */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
            Security Tips:
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Never share your PIN with anyone</li>
            <li>• Nolojia staff will never ask for your PIN</li>
            <li>• Change your PIN regularly in Settings</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// PIN Setup Component
export function PinSetup({ onPinSet }: { onPinSet: (pin: string) => void }) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [error, setError] = useState('')

  const handlePinSubmit = async () => {
    if (step === 'create') {
      if (pin.length !== 6) {
        setError('PIN must be 6 digits')
        return
      }
      setStep('confirm')
      setError('')
    } else {
      if (confirmPin !== pin) {
        setError('PINs do not match')
        setConfirmPin('')
        return
      }

      // Hash and store the PIN
      const { hash, salt } = await hashPin(pin)
      await secureStorage.setSecure('user_pin', { hash, salt })

      onPinSet(pin)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-kenya-red" />
          <span>{step === 'create' ? 'Create Transaction PIN' : 'Confirm PIN'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {step === 'create'
            ? 'Create a 6-digit PIN for transaction security'
            : 'Re-enter your PIN to confirm'}
        </p>

        <div className="flex space-x-2">
          {[...Array(6)].map((_, i) => (
            <Input
              key={i}
              type="password"
              maxLength={1}
              className="w-12 h-12 text-center text-lg font-bold"
              value={(step === 'create' ? pin : confirmPin)[i] || ''}
              onChange={(e) => {
                const value = e.target.value
                if (/^\d*$/.test(value)) {
                  const currentPin = step === 'create' ? pin : confirmPin
                  const newPin = currentPin.split('')
                  newPin[i] = value
                  const updatedPin = newPin.join('')

                  if (step === 'create') {
                    setPin(updatedPin)
                  } else {
                    setConfirmPin(updatedPin)
                  }

                  // Auto-focus next input
                  if (value && i < 5) {
                    const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement
                    nextInput?.focus()
                  }
                }
              }}
            />
          ))}
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          className="w-full"
          onClick={handlePinSubmit}
          disabled={
            (step === 'create' && pin.length !== 6) ||
            (step === 'confirm' && confirmPin.length !== 6)
          }
        >
          {step === 'create' ? 'Continue' : 'Set PIN'}
        </Button>

        {step === 'confirm' && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setStep('create')
              setPin('')
              setConfirmPin('')
              setError('')
            }}
          >
            Start Over
          </Button>
        )}
      </CardContent>
    </Card>
  )
}