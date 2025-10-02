import { Injectable, Logger } from '@nestjs/common'
import * as crypto from 'crypto'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'

export interface EncryptedData {
  data: string
  iv: string
  salt?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name)
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32
  private readonly ivLength = 16
  private readonly saltLength = 32
  private readonly tagLength = 16

  constructor() {
    // Validate environment variables
    if (!process.env.ENCRYPTION_KEY) {
      this.logger.error('ENCRYPTION_KEY environment variable is required')
      throw new Error('Encryption key not configured')
    }
    if (!process.env.JWT_SECRET) {
      this.logger.error('JWT_SECRET environment variable is required')
      throw new Error('JWT secret not configured')
    }
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encrypt(data: string, key?: string): EncryptedData {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_KEY!
      const iv = crypto.randomBytes(this.ivLength)
      const salt = crypto.randomBytes(this.saltLength)

      // Derive key from password and salt
      const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 100000, this.keyLength, 'sha256')

      const cipher = crypto.createCipher(this.algorithm, derivedKey)
      cipher.setAAD(salt) // Additional authenticated data

      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const authTag = cipher.getAuthTag()

      return {
        data: encrypted + authTag.toString('hex'),
        iv: iv.toString('hex'),
        salt: salt.toString('hex')
      }
    } catch (error) {
      this.logger.error('Encryption failed:', error)
      throw new Error('Encryption failed')
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: EncryptedData, key?: string): string {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_KEY!
      const iv = Buffer.from(encryptedData.iv, 'hex')
      const salt = Buffer.from(encryptedData.salt!, 'hex')

      // Derive the same key
      const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 100000, this.keyLength, 'sha256')

      // Extract encrypted data and auth tag
      const authTag = Buffer.from(encryptedData.data.slice(-32), 'hex')
      const encrypted = encryptedData.data.slice(0, -32)

      const decipher = crypto.createDecipher(this.algorithm, derivedKey)
      decipher.setAAD(salt)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      this.logger.error('Decryption failed:', error)
      throw new Error('Decryption failed')
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Generate JWT token pair (access + refresh)
   */
  generateTokenPair(payload: any, options?: {
    accessExpiresIn?: string
    refreshExpiresIn?: string
  }): TokenPair {
    const accessExpiresIn = options?.accessExpiresIn || '15m'
    const refreshExpiresIn = options?.refreshExpiresIn || '7d'

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      process.env.JWT_SECRET!,
      {
        expiresIn: accessExpiresIn,
        issuer: 'nolojia-wallet',
        audience: 'nolojia-wallet-client'
      }
    )

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
      {
        expiresIn: refreshExpiresIn,
        issuer: 'nolojia-wallet',
        audience: 'nolojia-wallet-client'
      }
    )

    return { accessToken, refreshToken }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string, type: 'access' | 'refresh' = 'access'): any {
    try {
      const secret = type === 'refresh'
        ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!)
        : process.env.JWT_SECRET!

      const decoded = jwt.verify(token, secret, {
        issuer: 'nolojia-wallet',
        audience: 'nolojia-wallet-client'
      })

      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token')
      }
      throw error
    }
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Generate OTP
   */
  generateOTP(length: number = 6): string {
    const digits = '0123456789'
    let otp = ''
    for (let i = 0; i < length; i++) {
      otp += digits[crypto.randomInt(0, digits.length)]
    }
    return otp
  }

  /**
   * Hash PIN for storage
   */
  async hashPin(pin: string): Promise<{ hash: string; salt: string }> {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(pin, salt, 100000, 32, 'sha256').toString('hex')
    return { hash, salt }
  }

  /**
   * Verify PIN
   */
  async verifyPin(pin: string, hash: string, salt: string): Promise<boolean> {
    const computedHash = crypto.pbkdf2Sync(pin, salt, 100000, 32, 'sha256').toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'))
  }

  /**
   * Encrypt database fields
   */
  encryptField(value: string): string {
    const encrypted = this.encrypt(value)
    return JSON.stringify(encrypted)
  }

  /**
   * Decrypt database fields
   */
  decryptField(encryptedValue: string): string {
    const encryptedData = JSON.parse(encryptedValue) as EncryptedData
    return this.decrypt(encryptedData)
  }

  /**
   * Generate transaction signature
   */
  signTransaction(transactionData: any, privateKey: string): string {
    const dataString = JSON.stringify(transactionData)
    const signature = crypto.sign('sha256', Buffer.from(dataString))
    const sign = signature.update(privateKey).sign('hex')
    return sign
  }

  /**
   * Verify transaction signature
   */
  verifyTransactionSignature(
    transactionData: any,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      const dataString = JSON.stringify(transactionData)
      const verifier = crypto.createVerify('sha256')
      verifier.update(dataString)
      return verifier.verify(publicKey, signature, 'hex')
    } catch (error) {
      this.logger.error('Signature verification failed:', error)
      return false
    }
  }

  /**
   * Generate API key
   */
  generateApiKey(): string {
    const prefix = 'nw_' // Nolojia Wallet prefix
    const randomPart = this.generateSecureToken(32)
    return `${prefix}${randomPart}`
  }

  /**
   * Hash API key for storage
   */
  async hashApiKey(apiKey: string): Promise<string> {
    return this.hashPassword(apiKey)
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars) {
      return '****'
    }
    const start = data.slice(0, 2)
    const end = data.slice(-2)
    const middle = '*'.repeat(data.length - 4)
    return `${start}${middle}${end}`
  }

  /**
   * Encrypt object properties
   */
  encryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[]
  ): T {
    const encrypted = { ...obj }
    fieldsToEncrypt.forEach(field => {
      if (encrypted[field] !== undefined && encrypted[field] !== null) {
        encrypted[field] = this.encryptField(String(encrypted[field]))
      }
    })
    return encrypted
  }

  /**
   * Decrypt object properties
   */
  decryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[]
  ): T {
    const decrypted = { ...obj }
    fieldsToDecrypt.forEach(field => {
      if (decrypted[field] !== undefined && decrypted[field] !== null) {
        try {
          decrypted[field] = this.decryptField(String(decrypted[field])) as any
        } catch (error) {
          this.logger.error(`Failed to decrypt field ${String(field)}:`, error)
          // Keep original value if decryption fails
        }
      }
    })
    return decrypted
  }

  /**
   * Generate secure session ID
   */
  generateSessionId(): string {
    const timestamp = Date.now().toString(36)
    const random = this.generateSecureToken(16)
    return `${timestamp}_${random}`
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  }

  /**
   * Generate HMAC for data integrity
   */
  generateHMAC(data: string, secret?: string): string {
    const hmacSecret = secret || process.env.HMAC_SECRET || process.env.JWT_SECRET!
    return crypto.createHmac('sha256', hmacSecret).update(data).digest('hex')
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data: string, hmac: string, secret?: string): boolean {
    const expectedHmac = this.generateHMAC(data, secret)
    return this.secureCompare(hmac, expectedHmac)
  }
}