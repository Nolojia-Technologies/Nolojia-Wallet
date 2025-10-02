import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
  ConflictException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EncryptionService, TokenPair } from '../../common/services/encryption.service'
import * as speakeasy from 'speakeasy'
import * as qrcode from 'qrcode'

// Entities (simplified - you'd have proper TypeORM entities)
interface User {
  id: string
  email: string
  passwordHash: string
  pin?: string
  pinSalt?: string
  twoFactorSecret?: string
  twoFactorEnabled: boolean
  isActive: boolean
  lastLogin?: Date
  failedLoginAttempts: number
  lockedUntil?: Date
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

interface RefreshToken {
  id: string
  userId: string
  token: string
  expiresAt: Date
  deviceId?: string
  ipAddress: string
  userAgent: string
  isRevoked: boolean
  createdAt: Date
}

interface LoginSession {
  id: string
  userId: string
  sessionId: string
  ipAddress: string
  userAgent: string
  lastActivity: Date
  expiresAt: Date
  isActive: boolean
}

export interface LoginRequest {
  email: string
  password: string
  deviceId?: string
  twoFactorCode?: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phoneNumber: string
  pin: string
}

export interface AuthResponse {
  user: Partial<User>
  tokens: TokenPair
  sessionId: string
  requiresTwoFactor?: boolean
  twoFactorSetupQR?: string
}

@Injectable()
export class SecureAuthService {
  private readonly logger = new Logger(SecureAuthService.name)
  private readonly MAX_LOGIN_ATTEMPTS = 5
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes
  private readonly MAX_SESSIONS_PER_USER = 5

  constructor(
    // @InjectRepository(User) private userRepository: Repository<User>,
    // @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>,
    // @InjectRepository(LoginSession) private sessionRepository: Repository<LoginSession>,
    private encryptionService: EncryptionService
  ) {}

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const { email, password, name, phoneNumber, pin } = registerData

    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(email)
      if (existingUser) {
        throw new ConflictException('User with this email already exists')
      }

      // Validate password strength
      this.validatePasswordStrength(password)

      // Validate PIN
      this.validatePin(pin)

      // Hash password and PIN
      const passwordHash = await this.encryptionService.hashPassword(password)
      const { hash: pinHash, salt: pinSalt } = await this.encryptionService.hashPin(pin)

      // Generate 2FA secret
      const twoFactorSecret = speakeasy.generateSecret({
        name: `Nolojia Wallet (${email})`,
        issuer: 'Nolojia Wallet'
      })

      // Create user
      const user: User = {
        id: this.encryptionService.generateSecureToken(),
        email: email.toLowerCase(),
        passwordHash,
        pin: pinHash,
        pinSalt,
        twoFactorSecret: twoFactorSecret.base32,
        twoFactorEnabled: false,
        isActive: true,
        failedLoginAttempts: 0,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save user (simulate database save)
      await this.saveUser(user)

      // Generate QR code for 2FA setup
      const qrCodeUrl = speakeasy.otpauthURL({
        secret: twoFactorSecret.base32,
        label: email,
        issuer: 'Nolojia Wallet',
        encoding: 'base32'
      })

      const qrCodeDataURL = await qrcode.toDataURL(qrCodeUrl)

      // Generate tokens
      const tokens = this.encryptionService.generateTokenPair({
        sub: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled
      })

      // Create session
      const sessionId = await this.createSession(user.id, 'unknown', 'registration')

      this.logger.log(`User registered: ${email}`)

      return {
        user: this.sanitizeUser(user),
        tokens,
        sessionId,
        requiresTwoFactor: false,
        twoFactorSetupQR: qrCodeDataURL
      }

    } catch (error) {
      this.logger.error('Registration failed:', error)
      throw error
    }
  }

  async login(loginData: LoginRequest, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    const { email, password, deviceId, twoFactorCode, rememberMe } = loginData

    try {
      // Find user
      const user = await this.findUserByEmail(email)
      if (!user) {
        // Use constant-time comparison to prevent user enumeration
        await this.encryptionService.hashPassword('dummy_password')
        throw new UnauthorizedException('Invalid credentials')
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
        throw new ForbiddenException(`Account locked. Try again in ${remainingTime} minutes`)
      }

      // Check if account is active
      if (!user.isActive) {
        throw new ForbiddenException('Account is deactivated')
      }

      // Verify password
      const isPasswordValid = await this.encryptionService.verifyPassword(password, user.passwordHash)
      if (!isPasswordValid) {
        await this.handleFailedLogin(user)
        throw new UnauthorizedException('Invalid credentials')
      }

      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          return {
            user: this.sanitizeUser(user),
            tokens: { accessToken: '', refreshToken: '' },
            sessionId: '',
            requiresTwoFactor: true
          }
        }

        const isTwoFactorValid = speakeasy.totp.verify({
          secret: user.twoFactorSecret!,
          encoding: 'base32',
          token: twoFactorCode,
          window: 2 // Allow 2 time steps of variance
        })

        if (!isTwoFactorValid) {
          await this.handleFailedLogin(user)
          throw new UnauthorizedException('Invalid two-factor authentication code')
        }
      }

      // Reset failed attempts
      user.failedLoginAttempts = 0
      user.lockedUntil = undefined
      user.lastLogin = new Date()
      await this.saveUser(user)

      // Generate tokens
      const tokenExpiryOptions = rememberMe
        ? { accessExpiresIn: '1h', refreshExpiresIn: '30d' }
        : { accessExpiresIn: '15m', refreshExpiresIn: '7d' }

      const tokens = this.encryptionService.generateTokenPair({
        sub: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled
      }, tokenExpiryOptions)

      // Create refresh token record
      await this.createRefreshToken(user.id, tokens.refreshToken, deviceId, ipAddress, userAgent)

      // Create session
      const sessionId = await this.createSession(user.id, ipAddress, userAgent)

      // Cleanup old sessions
      await this.cleanupOldSessions(user.id)

      this.logger.log(`User logged in: ${email} from ${ipAddress}`)

      return {
        user: this.sanitizeUser(user),
        tokens,
        sessionId
      }

    } catch (error) {
      this.logger.error('Login failed:', error)
      throw error
    }
  }

  async refreshToken(refreshToken: string, ipAddress: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = this.encryptionService.verifyToken(refreshToken, 'refresh')

      // Check if refresh token exists and is valid
      const tokenRecord = await this.findRefreshToken(refreshToken)
      if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      // Check if IP matches (optional security measure)
      if (tokenRecord.ipAddress !== ipAddress) {
        this.logger.warn(`Refresh token used from different IP: ${ipAddress} vs ${tokenRecord.ipAddress}`)
        // You might want to revoke the token and require re-authentication
      }

      // Get user
      const user = await this.findUserById(decoded.sub)
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive')
      }

      // Generate new tokens
      const newTokens = this.encryptionService.generateTokenPair({
        sub: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled
      })

      // Update refresh token record
      tokenRecord.token = newTokens.refreshToken
      tokenRecord.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      await this.saveRefreshToken(tokenRecord)

      this.logger.log(`Token refreshed for user: ${user.email}`)

      return newTokens

    } catch (error) {
      this.logger.error('Token refresh failed:', error)
      throw new UnauthorizedException('Token refresh failed')
    }
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    try {
      // Revoke all refresh tokens for user
      await this.revokeUserRefreshTokens(userId)

      // Deactivate sessions
      if (sessionId) {
        await this.deactivateSession(sessionId)
      } else {
        await this.deactivateUserSessions(userId)
      }

      this.logger.log(`User logged out: ${userId}`)

    } catch (error) {
      this.logger.error('Logout failed:', error)
      throw error
    }
  }

  async setupTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      const user = await this.findUserById(userId)
      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      // Verify the provided token
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token,
        window: 2
      })

      if (!isValid) {
        throw new BadRequestException('Invalid verification code')
      }

      // Enable 2FA
      user.twoFactorEnabled = true
      await this.saveUser(user)

      this.logger.log(`2FA enabled for user: ${user.email}`)

      return true

    } catch (error) {
      this.logger.error('2FA setup failed:', error)
      throw error
    }
  }

  async disableTwoFactor(userId: string, password: string, token: string): Promise<boolean> {
    try {
      const user = await this.findUserById(userId)
      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      // Verify password
      const isPasswordValid = await this.encryptionService.verifyPassword(password, user.passwordHash)
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password')
      }

      // Verify 2FA token
      const isTokenValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token,
        window: 2
      })

      if (!isTokenValid) {
        throw new BadRequestException('Invalid verification code')
      }

      // Disable 2FA
      user.twoFactorEnabled = false
      await this.saveUser(user)

      this.logger.log(`2FA disabled for user: ${user.email}`)

      return true

    } catch (error) {
      this.logger.error('2FA disable failed:', error)
      throw error
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.findUserById(userId)
      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      // Verify current password
      const isCurrentPasswordValid = await this.encryptionService.verifyPassword(
        currentPassword,
        user.passwordHash
      )
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect')
      }

      // Validate new password strength
      this.validatePasswordStrength(newPassword)

      // Hash new password
      const newPasswordHash = await this.encryptionService.hashPassword(newPassword)

      // Update user
      user.passwordHash = newPasswordHash
      user.updatedAt = new Date()
      await this.saveUser(user)

      // Revoke all existing tokens to force re-authentication
      await this.revokeUserRefreshTokens(userId)
      await this.deactivateUserSessions(userId)

      this.logger.log(`Password changed for user: ${user.email}`)

      return true

    } catch (error) {
      this.logger.error('Password change failed:', error)
      throw error
    }
  }

  // Helper methods (these would interact with your actual database)
  private async findUserByEmail(email: string): Promise<User | null> {
    // Simulate database lookup
    return null
  }

  private async findUserById(id: string): Promise<User | null> {
    // Simulate database lookup
    return null
  }

  private async saveUser(user: User): Promise<void> {
    // Simulate database save
  }

  private async findRefreshToken(token: string): Promise<RefreshToken | null> {
    // Simulate database lookup
    return null
  }

  private async saveRefreshToken(token: RefreshToken): Promise<void> {
    // Simulate database save
  }

  private async createRefreshToken(
    userId: string,
    token: string,
    deviceId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const refreshToken: RefreshToken = {
      id: this.encryptionService.generateSecureToken(),
      userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceId,
      ipAddress,
      userAgent,
      isRevoked: false,
      createdAt: new Date()
    }

    await this.saveRefreshToken(refreshToken)
  }

  private async createSession(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    const sessionId = this.encryptionService.generateSessionId()

    const session: LoginSession = {
      id: this.encryptionService.generateSecureToken(),
      userId,
      sessionId,
      ipAddress,
      userAgent,
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isActive: true
    }

    // Save session
    return sessionId
  }

  private async revokeUserRefreshTokens(userId: string): Promise<void> {
    // Revoke all refresh tokens for user
  }

  private async deactivateSession(sessionId: string): Promise<void> {
    // Deactivate specific session
  }

  private async deactivateUserSessions(userId: string): Promise<void> {
    // Deactivate all user sessions
  }

  private async cleanupOldSessions(userId: string): Promise<void> {
    // Remove old sessions, keep only the latest MAX_SESSIONS_PER_USER
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.failedLoginAttempts++

    if (user.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION)
      this.logger.warn(`User account locked due to failed attempts: ${user.email}`)
    }

    await this.saveUser(user)
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long')
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter')
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter')
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new BadRequestException('Password must contain at least one number')
    }

    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character')
    }
  }

  private validatePin(pin: string): void {
    if (!/^\d{6}$/.test(pin)) {
      throw new BadRequestException('PIN must be exactly 6 digits')
    }

    // Check for weak PINs
    const weakPins = ['123456', '000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999']
    if (weakPins.includes(pin)) {
      throw new BadRequestException('PIN is too weak. Please choose a different PIN.')
    }
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, pin, pinSalt, twoFactorSecret, ...sanitized } = user
    return sanitized
  }
}