import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private store: RateLimitStore = {};

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Get rate limit configuration from decorator or use defaults
    const limit = this.reflector.getAllAndOverride<number>('rateLimit', [handler, classRef]) || 10;
    const windowMs = this.reflector.getAllAndOverride<number>('rateLimitWindow', [handler, classRef]) || 60000; // 1 minute

    // Create key based on IP and endpoint for financial operations
    const endpoint = request.route?.path || request.url;
    const isFinancialEndpoint = this.isFinancialEndpoint(endpoint);

    // Use more restrictive rate limiting for financial operations
    const actualLimit = isFinancialEndpoint ? Math.min(limit, 5) : limit;
    const key = `${request.ip}:${endpoint}:${request.user?.['id'] || 'anonymous'}`;

    const now = Date.now();
    const record = this.store[key];

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return true;
    }

    if (record.count >= actualLimit) {
      // Log suspicious activity for financial endpoints
      if (isFinancialEndpoint) {
        console.warn(`Rate limit exceeded for financial endpoint: ${endpoint} by user: ${request.user?.['id'] || 'anonymous'} from IP: ${request.ip}`);
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
    return true;
  }

  private isFinancialEndpoint(endpoint: string): boolean {
    const financialEndpoints = [
      '/topup/initiate',
      '/transactions/send',
      '/wallet/transfer',
      '/escrow/create',
      '/escrow/release',
    ];

    return financialEndpoints.some(fp => endpoint.includes(fp));
  }

  // Cleanup old entries periodically
  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
}

// Decorators for setting rate limit configuration
export const RateLimit = (limit: number) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    const Reflector = require('@nestjs/core').Reflector;
    const reflector = new Reflector();
    reflector.getAllAndOverride = reflector.getAllAndOverride || reflector.get;

    if (descriptor) {
      Reflect.defineMetadata('rateLimit', limit, descriptor.value);
    } else {
      Reflect.defineMetadata('rateLimit', limit, target);
    }
  };
};

export const RateLimitWindow = (windowMs: number) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata('rateLimitWindow', windowMs, descriptor.value);
    } else {
      Reflect.defineMetadata('rateLimitWindow', windowMs, target);
    }
  };
};