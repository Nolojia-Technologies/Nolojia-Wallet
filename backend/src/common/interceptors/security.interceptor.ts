import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException
} from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { Request, Response } from 'express'
import { EncryptionService } from '../services/encryption.service'

interface SecurityEvent {
  type: string
  timestamp: Date
  ip: string
  userAgent: string
  path: string
  method: string
  userId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details?: any
  statusCode?: number
  responseTime?: number
}

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityInterceptor.name)
  private readonly securityEvents: SecurityEvent[] = []
  private readonly maxEvents = 10000 // Keep last 10k events in memory

  constructor(private encryptionService: EncryptionService) {
    // Cleanup old events every hour
    setInterval(() => {
      this.cleanupOldEvents()
    }, 60 * 60 * 1000)
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()
    const startTime = Date.now()

    // Pre-request security checks
    this.performPreRequestChecks(request)

    // Log request start
    this.logSecurityEvent({
      type: 'request_start',
      timestamp: new Date(),
      ip: this.getClientIP(request),
      userAgent: request.headers['user-agent'] || 'unknown',
      path: request.path,
      method: request.method,
      userId: this.getUserId(request),
      severity: 'low'
    })

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime

        // Log successful request
        this.logSecurityEvent({
          type: 'request_success',
          timestamp: new Date(),
          ip: this.getClientIP(request),
          userAgent: request.headers['user-agent'] || 'unknown',
          path: request.path,
          method: request.method,
          userId: this.getUserId(request),
          severity: 'low',
          statusCode: response.statusCode,
          responseTime
        })

        // Check for suspicious activity patterns
        this.detectSuspiciousActivity(request, response, responseTime)

        // Post-request security checks
        this.performPostRequestChecks(request, response, data)
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime

        // Log error with appropriate severity
        const severity = this.determineSeverity(error, request)

        this.logSecurityEvent({
          type: 'request_error',
          timestamp: new Date(),
          ip: this.getClientIP(request),
          userAgent: request.headers['user-agent'] || 'unknown',
          path: request.path,
          method: request.method,
          userId: this.getUserId(request),
          severity,
          statusCode: error.status || 500,
          responseTime,
          details: {
            errorType: error.constructor.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }
        })

        // Handle security-related errors
        if (this.isSecurityError(error)) {
          this.handleSecurityError(request, error)
        }

        return throwError(() => error)
      })
    )
  }

  private performPreRequestChecks(request: Request): void {
    // Check for suspicious headers
    this.checkSuspiciousHeaders(request)

    // Validate request timing
    this.checkRequestTiming(request)

    // Check for automated tools
    this.checkForAutomatedTools(request)

    // Validate content type for POST/PUT requests
    this.validateContentType(request)
  }

  private performPostRequestChecks(request: Request, response: Response, data: any): void {
    // Check for data leakage
    this.checkDataLeakage(request, response, data)

    // Monitor response patterns
    this.monitorResponsePatterns(request, response)

    // Check for potential information disclosure
    this.checkInformationDisclosure(response, data)
  }

  private checkSuspiciousHeaders(request: Request): void {
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-cluster-client-ip',
      'x-real-ip'
    ]

    const suspiciousValues = [
      'burpsuite',
      'sqlmap',
      'nmap',
      'nikto',
      'w3af',
      'owasp-zap'
    ]

    for (const header of suspiciousHeaders) {
      const value = request.headers[header] as string
      if (value && suspiciousValues.some(suspicious =>
        value.toLowerCase().includes(suspicious))) {
        this.logSecurityEvent({
          type: 'suspicious_header',
          timestamp: new Date(),
          ip: this.getClientIP(request),
          userAgent: request.headers['user-agent'] || 'unknown',
          path: request.path,
          method: request.method,
          severity: 'high',
          details: { header, value }
        })
      }
    }
  }

  private checkRequestTiming(request: Request): void {
    const userAgent = request.headers['user-agent'] as string
    const ip = this.getClientIP(request)

    // Check for rapid-fire requests (potential bot)
    const recentRequests = this.securityEvents.filter(event =>
      event.ip === ip &&
      event.timestamp > new Date(Date.now() - 10000) && // Last 10 seconds
      event.type === 'request_start'
    )

    if (recentRequests.length > 20) { // More than 20 requests in 10 seconds
      this.logSecurityEvent({
        type: 'rapid_fire_requests',
        timestamp: new Date(),
        ip,
        userAgent,
        path: request.path,
        method: request.method,
        severity: 'high',
        details: { requestCount: recentRequests.length, timeWindow: '10s' }
      })
    }
  }

  private checkForAutomatedTools(request: Request): void {
    const userAgent = (request.headers['user-agent'] || '').toLowerCase()
    const automatedToolPatterns = [
      'python-requests',
      'curl',
      'wget',
      'postman',
      'insomnia',
      'httpie',
      'bot',
      'crawler',
      'spider',
      'scraper'
    ]

    if (automatedToolPatterns.some(pattern => userAgent.includes(pattern))) {
      this.logSecurityEvent({
        type: 'automated_tool_detected',
        timestamp: new Date(),
        ip: this.getClientIP(request),
        userAgent: request.headers['user-agent'] || 'unknown',
        path: request.path,
        method: request.method,
        severity: 'medium',
        details: { detectedPattern: userAgent }
      })
    }
  }

  private validateContentType(request: Request): void {
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers['content-type']
      const acceptableTypes = [
        'application/json',
        'multipart/form-data',
        'application/x-www-form-urlencoded'
      ]

      if (contentType && !acceptableTypes.some(type => contentType.includes(type))) {
        this.logSecurityEvent({
          type: 'suspicious_content_type',
          timestamp: new Date(),
          ip: this.getClientIP(request),
          userAgent: request.headers['user-agent'] || 'unknown',
          path: request.path,
          method: request.method,
          severity: 'medium',
          details: { contentType }
        })
      }
    }
  }

  private checkDataLeakage(request: Request, response: Response, data: any): void {
    if (data && typeof data === 'object') {
      const sensitiveFields = [
        'password',
        'pin',
        'secret',
        'key',
        'token',
        'hash',
        'salt'
      ]

      const dataString = JSON.stringify(data).toLowerCase()
      const leakedFields = sensitiveFields.filter(field =>
        dataString.includes(field))

      if (leakedFields.length > 0) {
        this.logSecurityEvent({
          type: 'potential_data_leakage',
          timestamp: new Date(),
          ip: this.getClientIP(request),
          userAgent: request.headers['user-agent'] || 'unknown',
          path: request.path,
          method: request.method,
          severity: 'critical',
          details: { leakedFields }
        })
      }
    }
  }

  private monitorResponsePatterns(request: Request, response: Response): void {
    // Monitor for information disclosure patterns
    const headers = response.getHeaders()
    const suspiciousHeaders = ['server', 'x-powered-by', 'x-aspnet-version']

    for (const header of suspiciousHeaders) {
      if (headers[header]) {
        this.logSecurityEvent({
          type: 'information_disclosure_header',
          timestamp: new Date(),
          ip: this.getClientIP(request),
          userAgent: request.headers['user-agent'] || 'unknown',
          path: request.path,
          method: request.method,
          severity: 'low',
          details: { header, value: headers[header] }
        })
      }
    }
  }

  private checkInformationDisclosure(response: Response, data: any): void {
    // Check for stack traces in production
    if (process.env.NODE_ENV === 'production' && data && typeof data === 'object') {
      const dataString = JSON.stringify(data)
      const stackTracePatterns = [
        'at Object.',
        'at Function.',
        'at async',
        'Error:',
        'TypeError:',
        'ReferenceError:'
      ]

      if (stackTracePatterns.some(pattern => dataString.includes(pattern))) {
        this.logSecurityEvent({
          type: 'stack_trace_exposure',
          timestamp: new Date(),
          ip: 'system',
          userAgent: 'system',
          path: 'response',
          method: 'GET',
          severity: 'high',
          details: { containsStackTrace: true }
        })
      }
    }
  }

  private detectSuspiciousActivity(request: Request, response: Response, responseTime: number): void {
    const ip = this.getClientIP(request)

    // Detect timing attacks
    if (responseTime > 5000) { // More than 5 seconds
      this.logSecurityEvent({
        type: 'slow_response',
        timestamp: new Date(),
        ip,
        userAgent: request.headers['user-agent'] || 'unknown',
        path: request.path,
        method: request.method,
        severity: 'medium',
        details: { responseTime }
      })
    }

    // Detect pattern scanning
    const recentPaths = this.securityEvents
      .filter(event =>
        event.ip === ip &&
        event.timestamp > new Date(Date.now() - 60000) // Last minute
      )
      .map(event => event.path)

    const uniquePaths = new Set(recentPaths)
    if (uniquePaths.size > 10) { // More than 10 different paths in a minute
      this.logSecurityEvent({
        type: 'path_scanning',
        timestamp: new Date(),
        ip,
        userAgent: request.headers['user-agent'] || 'unknown',
        path: request.path,
        method: request.method,
        severity: 'high',
        details: { uniquePathCount: uniquePaths.size, paths: Array.from(uniquePaths) }
      })
    }
  }

  private isSecurityError(error: any): boolean {
    return error instanceof HttpException &&
      [401, 403, 429].includes(error.getStatus())
  }

  private handleSecurityError(request: Request, error: any): void {
    const ip = this.getClientIP(request)

    // Increment failure count for this IP
    const recentFailures = this.securityEvents.filter(event =>
      event.ip === ip &&
      event.timestamp > new Date(Date.now() - 3600000) && // Last hour
      event.type === 'request_error' &&
      event.statusCode && [401, 403].includes(event.statusCode)
    )

    if (recentFailures.length > 10) {
      this.logSecurityEvent({
        type: 'potential_brute_force',
        timestamp: new Date(),
        ip,
        userAgent: request.headers['user-agent'] || 'unknown',
        path: request.path,
        method: request.method,
        severity: 'critical',
        details: { failureCount: recentFailures.length, timeWindow: '1h' }
      })
    }
  }

  private determineSeverity(error: any, request: Request): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof HttpException) {
      const status = error.getStatus()

      if (status === 401 || status === 403) return 'high'
      if (status === 429) return 'medium'
      if (status >= 500) return 'critical'
      if (status >= 400) return 'medium'
    }

    // Check if error involves sensitive endpoints
    const sensitiveEndpoints = ['/auth', '/admin', '/payment', '/transaction']
    if (sensitiveEndpoints.some(endpoint => request.path.includes(endpoint))) {
      return 'high'
    }

    return 'low'
  }

  private logSecurityEvent(event: SecurityEvent): void {
    // Add to in-memory events
    this.securityEvents.push(event)

    // Keep only recent events
    if (this.securityEvents.length > this.maxEvents) {
      this.securityEvents.splice(0, this.securityEvents.length - this.maxEvents)
    }

    // Log based on severity
    const logData = {
      ...event,
      details: this.maskSensitiveData(event.details)
    }

    switch (event.severity) {
      case 'critical':
        this.logger.error('CRITICAL SECURITY EVENT', logData)
        // In production, trigger immediate alerts
        break
      case 'high':
        this.logger.warn('HIGH SECURITY EVENT', logData)
        break
      case 'medium':
        this.logger.warn('MEDIUM SECURITY EVENT', logData)
        break
      case 'low':
        if (process.env.SECURITY_LOG_LEVEL === 'debug') {
          this.logger.debug('LOW SECURITY EVENT', logData)
        }
        break
    }

    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production' && event.severity !== 'low') {
      this.sendToSecurityService(event)
    }
  }

  private cleanupOldEvents(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    const indexToRemove = this.securityEvents.findIndex(event => event.timestamp < cutoffTime)

    if (indexToRemove !== -1) {
      this.securityEvents.splice(0, indexToRemove)
    }
  }

  private getClientIP(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim()
  }

  private getUserId(request: Request): string | undefined {
    return request['user']?.sub || request['user']?.id
  }

  private maskSensitiveData(details: any): any {
    if (!details || typeof details !== 'object') return details

    const sensitiveKeys = ['password', 'pin', 'token', 'secret', 'key', 'hash']
    const masked = { ...details }

    for (const key of Object.keys(masked)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        masked[key] = this.encryptionService.maskSensitiveData(String(masked[key]))
      }
    }

    return masked
  }

  private async sendToSecurityService(event: SecurityEvent): Promise<void> {
    // In production, implement integration with security monitoring services
    // Examples: Splunk, ELK Stack, Datadog, etc.
    try {
      // Example implementation
      console.log('Security event sent to monitoring service:', event)
    } catch (error) {
      this.logger.error('Failed to send security event to monitoring service:', error)
    }
  }

  // Public method to get security events for admin dashboard
  getSecurityEvents(filters?: {
    severity?: string
    type?: string
    ip?: string
    timeRange?: { start: Date; end: Date }
  }): SecurityEvent[] {
    let events = [...this.securityEvents]

    if (filters) {
      if (filters.severity) {
        events = events.filter(event => event.severity === filters.severity)
      }
      if (filters.type) {
        events = events.filter(event => event.type === filters.type)
      }
      if (filters.ip) {
        events = events.filter(event => event.ip === filters.ip)
      }
      if (filters.timeRange) {
        events = events.filter(event =>
          event.timestamp >= filters.timeRange!.start &&
          event.timestamp <= filters.timeRange!.end
        )
      }
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Get security statistics
  getSecurityStats(): {
    totalEvents: number
    eventsBySeverity: Record<string, number>
    eventsByType: Record<string, number>
    topIPs: Array<{ ip: string; count: number }>
  } {
    const eventsBySeverity = this.securityEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const eventsByType = this.securityEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const ipCounts = this.securityEvents.reduce((acc, event) => {
      acc[event.ip] = (acc[event.ip] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))

    return {
      totalEvents: this.securityEvents.length,
      eventsBySeverity,
      eventsByType,
      topIPs
    }
  }
}