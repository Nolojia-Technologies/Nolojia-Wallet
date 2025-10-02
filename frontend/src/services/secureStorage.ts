/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data in localStorage
 */

import {
  encryptData,
  decryptData,
  encryptObject,
  decryptObject,
  generateSessionToken,
  deriveWalletKey
} from '@/lib/encryption'

class SecureStorageService {
  private static instance: SecureStorageService
  private encryptionKey: string | null = null
  private sessionToken: string | null = null

  private constructor() {
    this.initializeSession()
  }

  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService()
    }
    return SecureStorageService.instance
  }

  private initializeSession() {
    // Generate a session token for this session
    this.sessionToken = generateSessionToken()

    // Store session token in sessionStorage (cleared on browser close)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nolojia_session', this.sessionToken)
    }
  }

  // Initialize encryption with user credentials
  async initialize(userId: string, pin: string): Promise<void> {
    try {
      // Derive encryption key from user credentials
      this.encryptionKey = await deriveWalletKey(userId, pin, 'storage')

      // Store encrypted session info
      const sessionInfo = {
        userId,
        timestamp: Date.now(),
        sessionToken: this.sessionToken
      }

      await this.setSecure('session_info', sessionInfo)
    } catch (error) {
      console.error('Failed to initialize secure storage:', error)
      throw new Error('Secure storage initialization failed')
    }
  }

  // Check if storage is initialized
  isInitialized(): boolean {
    return this.encryptionKey !== null
  }

  // Clear encryption key (on logout)
  clearSession(): void {
    this.encryptionKey = null
    this.sessionToken = null
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nolojia_session')
    }
  }

  // Set encrypted item in localStorage
  async setSecure(key: string, value: any): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Secure storage not initialized')
    }

    try {
      const dataStr = JSON.stringify(value)
      const encrypted = await encryptData(dataStr, this.encryptionKey)

      const storageItem = {
        data: encrypted,
        timestamp: Date.now(),
        sessionToken: this.sessionToken
      }

      localStorage.setItem(`secure_${key}`, JSON.stringify(storageItem))
    } catch (error) {
      console.error(`Failed to store secure item ${key}:`, error)
      throw new Error('Failed to store secure data')
    }
  }

  // Get decrypted item from localStorage
  async getSecure<T>(key: string): Promise<T | null> {
    if (!this.encryptionKey) {
      throw new Error('Secure storage not initialized')
    }

    try {
      const itemStr = localStorage.getItem(`secure_${key}`)
      if (!itemStr) return null

      const storageItem = JSON.parse(itemStr)

      // Validate session token
      if (storageItem.sessionToken !== this.sessionToken) {
        console.warn('Session token mismatch, data may be from another session')
      }

      const decrypted = await decryptData(storageItem.data, this.encryptionKey)
      return JSON.parse(decrypted) as T
    } catch (error) {
      console.error(`Failed to retrieve secure item ${key}:`, error)
      return null
    }
  }

  // Remove item from secure storage
  removeSecure(key: string): void {
    localStorage.removeItem(`secure_${key}`)
  }

  // Store sensitive user data
  async storeUserData(userData: any): Promise<void> {
    // Encrypt sensitive fields
    const sensitiveFields = ['pin', 'phoneNumber', 'email', 'nationalId']
    const encrypted = await encryptObject(userData, this.encryptionKey!, sensitiveFields)

    await this.setSecure('user_data', encrypted)
  }

  // Retrieve and decrypt user data
  async getUserData(): Promise<any> {
    const encrypted = await this.getSecure<any>('user_data')
    if (!encrypted) return null

    const sensitiveFields = ['pin', 'phoneNumber', 'email', 'nationalId']
    return decryptObject(encrypted, this.encryptionKey!, sensitiveFields)
  }

  // Store transaction history with encryption
  async storeTransactions(transactions: any[]): Promise<void> {
    // Encrypt amount and account details for each transaction
    const encryptedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        const sensitiveFields = ['amount', 'recipientAccount', 'senderAccount', 'reference']
        return encryptObject(tx, this.encryptionKey!, sensitiveFields)
      })
    )

    await this.setSecure('transactions', encryptedTransactions)
  }

  // Get decrypted transactions
  async getTransactions(): Promise<any[]> {
    const encrypted = await this.getSecure<any[]>('transactions')
    if (!encrypted) return []

    return Promise.all(
      encrypted.map(async (tx) => {
        const sensitiveFields = ['amount', 'recipientAccount', 'senderAccount', 'reference']
        return decryptObject(tx, this.encryptionKey!, sensitiveFields)
      })
    )
  }

  // Store wallet credentials securely
  async storeWalletCredentials(credentials: {
    walletId: string
    privateKey?: string
    mnemonic?: string
  }): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Secure storage not initialized')
    }

    // Never store private keys or mnemonics in plain text
    const encrypted = await encryptObject(
      credentials,
      this.encryptionKey,
      ['privateKey', 'mnemonic']
    )

    await this.setSecure('wallet_credentials', encrypted)
  }

  // Clear all secure storage
  clearAllSecureStorage(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key)
      }
    })
    this.clearSession()
  }

  // Validate storage integrity
  async validateIntegrity(): Promise<boolean> {
    try {
      const sessionInfo = await this.getSecure<any>('session_info')
      if (!sessionInfo) return false

      // Check if session is expired (24 hours)
      const sessionAge = Date.now() - sessionInfo.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      if (sessionAge > maxAge) {
        console.warn('Session expired')
        this.clearAllSecureStorage()
        return false
      }

      return sessionInfo.sessionToken === this.sessionToken
    } catch (error) {
      console.error('Integrity validation failed:', error)
      return false
    }
  }

  // Export encrypted backup
  async exportBackup(backupPassword: string): Promise<string> {
    const allData: Record<string, any> = {}

    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith('secure_')) {
        const value = localStorage.getItem(key)
        if (value) {
          allData[key] = value
        }
      }
    }

    const backup = {
      version: '1.0',
      timestamp: Date.now(),
      data: allData
    }

    return encryptData(JSON.stringify(backup), backupPassword)
  }

  // Import encrypted backup
  async importBackup(backupData: string, backupPassword: string): Promise<void> {
    try {
      const decrypted = await decryptData(backupData, backupPassword)
      const backup = JSON.parse(decrypted)

      if (backup.version !== '1.0') {
        throw new Error('Unsupported backup version')
      }

      // Clear existing data
      this.clearAllSecureStorage()

      // Restore backup data
      Object.entries(backup.data).forEach(([key, value]) => {
        localStorage.setItem(key, value as string)
      })

      console.log('Backup restored successfully')
    } catch (error) {
      console.error('Failed to import backup:', error)
      throw new Error('Backup import failed')
    }
  }
}

// Export singleton instance
export const secureStorage = SecureStorageService.getInstance()

// Export convenience functions
export const initializeSecureStorage = (userId: string, pin: string) =>
  secureStorage.initialize(userId, pin)

export const clearSecureStorage = () => secureStorage.clearSession()

export const storeSecureData = async (key: string, value: any) =>
  secureStorage.setSecure(key, value)

export const getSecureData = async <T>(key: string) =>
  secureStorage.getSecure<T>(key)

export const removeSecureData = (key: string) =>
  secureStorage.removeSecure(key)