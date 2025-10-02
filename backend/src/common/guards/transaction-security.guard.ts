import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class TransactionSecurityGuard implements CanActivate {
  private suspiciousPatterns: Map<string, number> = new Map();
  private readonly MAX_DAILY_AMOUNT = 1000000; // 1M KES per day
  private readonly MAX_SINGLE_TRANSACTION = 500000; // 500K KES per transaction
  private readonly SUSPICIOUS_VELOCITY_THRESHOLD = 5; // transactions per minute

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;
    const body = request.body;

    if (!user) {
      throw new ForbiddenException('Authentication required for financial operations');
    }

    // Validate transaction amount
    if (body.amount) {
      await this.validateTransactionAmount(body.amount, user.id);
    }

    // Check for suspicious patterns
    await this.checkSuspiciousActivity(user.id, request.ip);

    // Validate request integrity
    this.validateRequestIntegrity(request);

    return true;
  }

  private async validateTransactionAmount(amount: number, userId: string): Promise<void> {
    // Check single transaction limit
    if (amount > this.MAX_SINGLE_TRANSACTION) {
      console.warn(`Large transaction attempt: ${amount} KES by user ${userId}`);
      throw new BadRequestException('Transaction amount exceeds single transaction limit');
    }

    // Check daily limits (in production, fetch from database)
    // For now, we'll use a simple check
    if (amount > this.MAX_DAILY_AMOUNT) {
      throw new BadRequestException('Transaction amount exceeds daily limit');
    }

    // Check for suspicious amounts (round numbers, common fraud patterns)
    if (this.isSuspiciousAmount(amount)) {
      console.warn(`Suspicious amount pattern: ${amount} KES by user ${userId}`);
    }
  }

  private async checkSuspiciousActivity(userId: string, ip: string): Promise<void> {
    const key = `${userId}:${ip}`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get current activity count
    const currentCount = this.suspiciousPatterns.get(key) || 0;

    if (currentCount >= this.SUSPICIOUS_VELOCITY_THRESHOLD) {
      console.error(`Suspicious transaction velocity detected for user ${userId} from IP ${ip}`);
      throw new ForbiddenException('Suspicious activity detected. Please try again later.');
    }

    // Increment counter
    this.suspiciousPatterns.set(key, currentCount + 1);

    // Cleanup old entries (simplified - in production use Redis with TTL)
    setTimeout(() => {
      this.suspiciousPatterns.delete(key);
    }, 60000);
  }

  private validateRequestIntegrity(request: Request): void {
    // Check for required headers
    const requiredHeaders = ['user-agent', 'accept'];
    for (const header of requiredHeaders) {
      if (!request.headers[header]) {
        throw new BadRequestException(`Missing required header: ${header}`);
      }
    }

    // Validate Content-Type for POST requests
    if (request.method === 'POST' && !request.headers['content-type']?.includes('application/json')) {
      throw new BadRequestException('Invalid content type');
    }

    // Check for suspicious user agents
    const userAgent = request.headers['user-agent'] as string;
    if (this.isSuspiciousUserAgent(userAgent)) {
      console.warn(`Suspicious user agent detected: ${userAgent} from IP: ${request.ip}`);
    }
  }

  private isSuspiciousAmount(amount: number): boolean {
    // Check for common fraud patterns
    const amountStr = amount.toString();

    // Very round numbers (like 100000, 50000, etc.)
    if (amount % 10000 === 0 && amount >= 50000) {
      return true;
    }

    // Repeated digits
    if (/(\d)\1{3,}/.test(amountStr)) {
      return true;
    }

    // Sequential numbers
    if (this.hasSequentialDigits(amountStr)) {
      return true;
    }

    return false;
  }

  private hasSequentialDigits(str: string): boolean {
    for (let i = 0; i < str.length - 2; i++) {
      const a = parseInt(str[i]);
      const b = parseInt(str[i + 1]);
      const c = parseInt(str[i + 2]);

      if (b === a + 1 && c === b + 1) {
        return true;
      }
    }
    return false;
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /curl/i,
      /wget/i,
      /python/i,
      /postman/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
}