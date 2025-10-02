import { Injectable, Logger } from '@nestjs/common';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  TOPUP_INITIATED = 'TOPUP_INITIATED',
  TOPUP_COMPLETED = 'TOPUP_COMPLETED',
  TOPUP_FAILED = 'TOPUP_FAILED',
  TOPUP_CANCELLED = 'TOPUP_CANCELLED',
  TRANSFER_INITIATED = 'TRANSFER_INITIATED',
  TRANSFER_COMPLETED = 'TRANSFER_COMPLETED',
  TRANSFER_FAILED = 'TRANSFER_FAILED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_WEBHOOK = 'INVALID_WEBHOOK',
  WEBHOOK_PROCESSED = 'WEBHOOK_PROCESSED',
  USER_CREATED = 'USER_CREATED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  async log(action: AuditAction, severity: AuditSeverity, description: string, context: any = {}): Promise<void> {
    try {
      this.logger.log(`[AUDIT] ${action}: ${description}`, { severity, context });
    } catch (error) {
      this.logger.error('Failed to save audit log', { error: error.message });
    }
  }
}