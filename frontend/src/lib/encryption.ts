/**
 * Client-side encryption utilities for securing sensitive data
 * Uses Web Crypto API for robust encryption
 */

// Generate a crypto key from a password
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypt data
export async function encryptData(data: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(password, salt)

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    )

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length)

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

// Decrypt data
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const data = combined.slice(28)

    const key = await deriveKey(password, salt)

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}

// Generate a secure random PIN
export function generateSecurePin(length: number = 6): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => (byte % 10).toString()).join('')
}

// Hash a PIN or password using PBKDF2
export async function hashPin(pin: string, saltString?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder()
  const salt = saltString
    ? encoder.encode(saltString)
    : crypto.getRandomValues(new Uint8Array(16))

  const pinKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    pinKey,
    256
  )

  const hashArray = new Uint8Array(hashBuffer)
  const hashHex = Array.from(hashArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  const saltHex = Array.from(salt)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  return { hash: hashHex, salt: saltHex }
}

// Verify a PIN against a hash
export async function verifyPin(pin: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPin(pin, salt)
  return hash === storedHash
}

// Generate a secure session token
export function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

// Encrypt sensitive object properties
export async function encryptObject<T extends Record<string, any>>(
  obj: T,
  password: string,
  keysToEncrypt: (keyof T)[]
): Promise<T> {
  const encrypted = { ...obj }

  for (const key of keysToEncrypt) {
    if (encrypted[key] !== undefined && encrypted[key] !== null) {
      const value = typeof encrypted[key] === 'string'
        ? encrypted[key]
        : JSON.stringify(encrypted[key])
      encrypted[key] = await encryptData(value, password) as any
    }
  }

  return encrypted
}

// Decrypt sensitive object properties
export async function decryptObject<T extends Record<string, any>>(
  obj: T,
  password: string,
  keysToDecrypt: (keyof T)[]
): Promise<T> {
  const decrypted = { ...obj }

  for (const key of keysToDecrypt) {
    if (decrypted[key] !== undefined && decrypted[key] !== null) {
      try {
        const value = await decryptData(decrypted[key] as string, password)
        // Try to parse as JSON, fallback to string
        try {
          decrypted[key] = JSON.parse(value)
        } catch {
          decrypted[key] = value as any
        }
      } catch (error) {
        console.error(`Failed to decrypt ${String(key)}:`, error)
        // Keep original value if decryption fails
      }
    }
  }

  return decrypted
}

// Secure key derivation for wallet operations
export async function deriveWalletKey(
  userId: string,
  pin: string,
  purpose: 'transaction' | 'storage' | 'backup'
): Promise<string> {
  const encoder = new TextEncoder()
  const combined = `${userId}:${pin}:${purpose}:nolojia-wallet`

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(combined),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(`salt:${purpose}`),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )

  const keyArray = new Uint8Array(derivedBits)
  return Array.from(keyArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

// Time-based OTP for 2FA
export function generateTOTP(secret: string, window: number = 30): string {
  const time = Math.floor(Date.now() / 1000 / window)
  const timeHex = time.toString(16).padStart(16, '0')

  // Simple TOTP implementation (in production, use a library)
  const hash = Array.from(secret + timeHex)
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)

  const otp = (hash % 1000000).toString().padStart(6, '0')
  return otp
}

// Mask sensitive data for display
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) return '****'
  const visible = data.slice(-visibleChars)
  const masked = '*'.repeat(Math.max(4, data.length - visibleChars))
  return masked + visible
}

// Validate password strength
export function validatePasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else feedback.push('Password should be at least 8 characters')

  if (password.length >= 12) score++

  if (/[a-z]/.test(password)) score++
  else feedback.push('Add lowercase letters')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Add uppercase letters')

  if (/[0-9]/.test(password)) score++
  else feedback.push('Add numbers')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else feedback.push('Add special characters')

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score--
    feedback.push('Avoid repeating characters')
  }

  if (/^[a-z]+$/i.test(password) || /^[0-9]+$/.test(password)) {
    score--
    feedback.push('Use a mix of character types')
  }

  return {
    score: Math.max(0, Math.min(5, score)),
    feedback
  }
}