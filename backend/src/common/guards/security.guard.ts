import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import * as rateLimit from 'express-rate-limit'
import * as slowDown from 'express-slow-down'
import { EncryptionService } from '../services/encryption.service'

// Rate limiting configurations
const createRateLimiter = (windowMs: number, max: number) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: 429
    }
  })

const createSlowDown = (windowMs: number, delayAfter: number, delayMs: number) =>
  slowDown({
    windowMs,
    delayAfter,
    delayMs,
    maxDelayMs: 10000 // Maximum 10 second delay
  })

// Different rate limits for different endpoints
export const rateLimiters = {
  // Authentication endpoints - stricter limits
  auth: createRateLimiter(15 * 60 * 1000, 5), // 5 attempts per 15 minutes

  // Transaction endpoints - moderate limits
  transaction: createRateLimiter(60 * 1000, 10), // 10 transactions per minute

  // General API endpoints
  general: createRateLimiter(15 * 60 * 1000, 100), // 100 requests per 15 minutes

  // Public endpoints - more lenient
  public: createRateLimiter(15 * 60 * 1000, 300), // 300 requests per 15 minutes
}

export const slowDowns = {
  auth: createSlowDown(15 * 60 * 1000, 2, 1000), // Delay after 2 attempts, 1s per attempt
  transaction: createSlowDown(60 * 1000, 5, 500), // Delay after 5 attempts, 500ms per attempt
}

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger(SecurityGuard.name)
  private readonly suspiciousIPs = new Set<string>()
  private readonly failedAttempts = new Map<string, { count: number; lastAttempt: Date }>()

  constructor(
    private reflector: Reflector,
    private encryptionService: EncryptionService
  ) {
    // Clean up failed attempts every hour
    setInterval(() => {
      this.cleanupFailedAttempts()
    }, 60 * 60 * 1000)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const handler = context.getHandler()
    const controller = context.getClass()

    // Get security metadata
    const requireAuth = this.reflector.get<boolean>('requireAuth', handler) ??
                       this.reflector.get<boolean>('requireAuth', controller) ??
                       true

    const securityLevel = this.reflector.get<'low' | 'medium' | 'high'>('securityLevel', handler) ??
                         this.reflector.get<'low' | 'medium' | 'high'>('securityLevel', controller) ??
                         'medium'

    // Perform security checks
    await this.performSecurityChecks(request, securityLevel)

    // Check authentication if required
    if (requireAuth) {
      await this.verifyAuthentication(request)
    }

    // Log security event
    this.logSecurityEvent(request, 'access_granted')

    return true
  }

  private async performSecurityChecks(request: Request, securityLevel: string): Promise<void> {
    const clientIP = this.getClientIP(request)
    const userAgent = request.headers['user-agent'] || ''

    // Check for suspicious IP
    if (this.suspiciousIPs.has(clientIP)) {
      this.logger.warn(`Suspicious IP attempted access: ${clientIP}`)
      throw new ForbiddenException('Access denied from suspicious IP')
    }

    // Check for security headers
    this.validateSecurityHeaders(request)

    // Check for SQL injection attempts
    this.checkSQLInjection(request)

    // Check for XSS attempts
    this.checkXSSAttempts(request)

    // Validate request size
    this.validateRequestSize(request)

    // Check for brute force attempts
    await this.checkBruteForce(request, clientIP)

    // Additional checks for high security level
    if (securityLevel === 'high') {
      await this.performHighSecurityChecks(request)
    }
  }

  private async verifyAuthentication(request: Request): Promise<void> {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No valid authentication token provided')
    }

    const token = authHeader.substring(7)

    try {
      const decoded = this.encryptionService.verifyToken(token, 'access')
      request['user'] = decoded

      // Check if token is blacklisted (implement token blacklist)
      if (await this.isTokenBlacklisted(token)) {
        throw new UnauthorizedException('Token has been revoked')
      }

      // Check for concurrent sessions (optional)
      await this.validateSession(decoded.sub, token)

    } catch (error) {
      this.logger.error('Authentication failed:', error.message)

      if (error.message === 'Token expired') {
        throw new UnauthorizedException('Token has expired')
      } else if (error.message === 'Invalid token') {
        throw new UnauthorizedException('Invalid authentication token')
      }

      throw new UnauthorizedException('Authentication failed')
    }
  }

  private validateSecurityHeaders(request: Request): void {
    const requiredHeaders = ['user-agent']

    for (const header of requiredHeaders) {
      if (!request.headers[header]) {
        this.logger.warn(`Missing required header: ${header}`)
        throw new ForbiddenException(`Missing required header: ${header}`)
      }
    }

    // Check for suspicious user agents
    const userAgent = request.headers['user-agent'] as string
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /sqlmap/i,
      /nmap/i,
      /nikto/i
    ]

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      this.logger.warn(`Suspicious user agent: ${userAgent}`)
      throw new ForbiddenException('Suspicious user agent detected')
    }
  }

  private checkSQLInjection(request: Request): void {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/i,
      /((\b(OR|AND)\b\s*['"]*\s*\d+\s*['"]*\s*=\s*['"]*\s*\d+))/i,
      /(\b(OR|AND)\b\s*['"]*[^']*['"]*\s*=\s*['"]*[^']*['"]*)/i
    ]

    const checkString = JSON.stringify({
      query: request.query,
      body: request.body,
      params: request.params
    })

    for (const pattern of sqlPatterns) {
      if (pattern.test(checkString)) {
        this.logger.error(`SQL injection attempt detected from ${this.getClientIP(request)}`)
        throw new ForbiddenException('SQL injection attempt detected')
      }
    }
  }

  private checkXSSAttempts(request: Request): void {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
    ]

    const checkString = JSON.stringify({
      query: request.query,
      body: request.body,
      params: request.params
    })

    for (const pattern of xssPatterns) {
      if (pattern.test(checkString)) {
        this.logger.error(`XSS attempt detected from ${this.getClientIP(request)}`)
        throw new ForbiddenException('XSS attempt detected')
      }
    }
  }

  private validateRequestSize(request: Request): void {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const contentLength = parseInt(request.headers['content-length'] || '0', 10)

    if (contentLength > maxSize) {
      throw new HttpException('Request too large', HttpStatus.PAYLOAD_TOO_LARGE)
    }
  }

  private async checkBruteForce(request: Request, clientIP: string): Promise<void> {
    const key = `${clientIP}:${request.path}`
    const now = new Date()
    const maxAttempts = 10
    const windowMinutes = 15

    const attempts = this.failedAttempts.get(key)

    if (attempts) {
      const timeDiff = now.getTime() - attempts.lastAttempt.getTime()
      const windowMs = windowMinutes * 60 * 1000

      if (timeDiff < windowMs && attempts.count >= maxAttempts) {
        this.suspiciousIPs.add(clientIP)
        this.logger.error(`Brute force attack detected from ${clientIP}`)
        throw new ForbiddenException('Too many failed attempts. IP temporarily blocked.')
      }

      if (timeDiff >= windowMs) {
        this.failedAttempts.delete(key)
      }
    }
  }

  private async performHighSecurityChecks(request: Request): Promise<void> {
    // Additional validation for high-security endpoints
    const clientIP = this.getClientIP(request)

    // Check if request is from a known good IP (whitelist)
    const trustedIPs = (process.env.TRUSTED_IPS || '').split(',')
    if (trustedIPs.length > 0 && !trustedIPs.includes(clientIP)) {
      this.logger.warn(`High security endpoint accessed from non-trusted IP: ${clientIP}`)
    }

    // Validate CSRF token for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      await this.validateCSRFToken(request)
    }

    // Check for suspicious timing patterns
    await this.checkTimingPatterns(request, clientIP)
  }

  private async validateCSRFToken(request: Request): Promise<void> {
    const csrfToken = request.headers['x-csrf-token'] as string
    const sessionToken = request.headers['x-session-token'] as string

    if (!csrfToken || !sessionToken) {
      throw new ForbiddenException('CSRF protection: Missing required tokens')
    }

    // Validate CSRF token against session
    if (!this.encryptionService.verifyHMAC(sessionToken, csrfToken)) {
      throw new ForbiddenException('CSRF protection: Invalid token')
    }
  }

  private async checkTimingPatterns(request: Request, clientIP: string): Promise<void> {
    // Implement timing attack detection
    const now = Date.now()
    const requestPattern = `${clientIP}:${request.path}`

    // Store request timing and analyze patterns
    // This is a simplified implementation
    const timingKey = `timing:${requestPattern}`
    // In a real implementation, you'd store this in Redis or a database
  }

  private getClientIP(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      (request.connection as any).socket?.remoteAddress ||
      'unknown'
    ).split(',')[0].trim()
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    // Implement token blacklist check
    // In a real implementation, check against Redis or database
    return false
  }

  private async validateSession(userId: string, token: string): Promise<void> {
    // Implement session validation
    // Check for concurrent sessions, session limits, etc.
  }

  private logSecurityEvent(request: Request, event: string): void {
    this.logger.log({
      event,
      ip: this.getClientIP(request),
      path: request.path,
      method: request.method,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString()
    })
  }

  private cleanupFailedAttempts(): void {
    const now = new Date()
    const cleanupTime = 24 * 60 * 60 * 1000 // 24 hours

    for (const [key, attempts] of this.failedAttempts.entries()) {
      const timeDiff = now.getTime() - attempts.lastAttempt.getTime()
      if (timeDiff > cleanupTime) {
        this.failedAttempts.delete(key)
      }
    }

    // Clear suspicious IPs after 24 hours
    // In a real implementation, you'd have more sophisticated IP reputation management
  }

  recordFailedAttempt(request: Request): void {
    const clientIP = this.getClientIP(request)
    const key = `${clientIP}:${request.path}`
    const now = new Date()

    const existing = this.failedAttempts.get(key)
    if (existing) {
      existing.count++
      existing.lastAttempt = now
    } else {
      this.failedAttempts.set(key, { count: 1, lastAttempt: now })
    }
  }
}

// Decorator for setting security level
export const SecurityLevel = (level: 'low' | 'medium' | 'high') =>
  Reflector.createDecorator<'low' | 'medium' | 'high'>({ key: 'securityLevel', value: level })

// Decorator for setting auth requirement
export const RequireAuth = (required: boolean = true) =>
  Reflector.createDecorator<boolean>({ key: 'requireAuth', value: required })