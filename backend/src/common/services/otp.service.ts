import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { EmailService } from './email.service';
import { AuditLogService, AuditAction, AuditSeverity } from './audit-log.service';
import * as crypto from 'crypto';

export interface OTPRecord {
  id: string;
  userId: string;
  email: string;
  otp: string;
  purpose: 'verification' | 'password_reset' | 'login' | 'transaction';
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
}

@Injectable()
export class OTPService {
  private readonly logger = new Logger(OTPService.name);
  private readonly otpStore = new Map<string, OTPRecord>();
  private readonly MAX_ATTEMPTS = 3;
  private readonly OTP_LENGTH = 6;
  private readonly DEFAULT_EXPIRY_MINUTES = 10;

  // Expiry times for different purposes
  private readonly EXPIRY_TIMES = {
    verification: 15, // 15 minutes
    password_reset: 10, // 10 minutes
    login: 5, // 5 minutes
    transaction: 3, // 3 minutes
  };

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
    private auditLogService: AuditLogService,
  ) {
    // Clean up expired OTPs every 5 minutes
    setInterval(() => this.cleanupExpiredOTPs(), 5 * 60 * 1000);
  }

  async generateAndSendOTP(
    email: string,
    purpose: 'verification' | 'password_reset' | 'login' | 'transaction',
    userId?: string,
  ): Promise<{ success: boolean; otpId: string; expiresIn: number }> {
    try {
      // Find user by email if userId not provided
      let user: User | null = null;
      if (userId) {
        user = await this.userRepository.findOne({ where: { id: userId } });
      } else {
        user = await this.userRepository.findOne({ where: { email } });
      }

      if (!user && purpose !== 'verification') {
        throw new BadRequestException('User not found');
      }

      // Generate OTP
      const otp = this.generateOTP();
      const otpId = this.generateOTPId();
      const expiryMinutes = this.EXPIRY_TIMES[purpose] || this.DEFAULT_EXPIRY_MINUTES;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Store OTP
      const otpRecord: OTPRecord = {
        id: otpId,
        userId: user?.id || 'pending',
        email,
        otp,
        purpose,
        expiresAt,
        attempts: 0,
        isUsed: false,
        createdAt: new Date(),
      };

      this.otpStore.set(otpId, otpRecord);

      // Send OTP email
      const emailSent = await this.emailService.sendOTPEmail(email, {
        name: user?.firstName || 'User',
        otp,
        expiresIn: expiryMinutes,
        purpose,
      });

      if (!emailSent) {
        this.otpStore.delete(otpId);
        throw new Error('Failed to send OTP email');
      }

      // Log OTP generation
      await this.auditLogService.log(
        AuditAction.WEBHOOK_RECEIVED, // Using as generic action
        AuditSeverity.LOW,
        `OTP generated for ${purpose}`,
        {
          userId: user?.id,
          metadata: {
            purpose,
            email: this.maskEmail(email),
            expiryMinutes,
          },
        },
      );

      this.logger.log(`OTP generated for ${purpose}: ${this.maskEmail(email)}`);

      return {
        success: true,
        otpId,
        expiresIn: expiryMinutes,
      };
    } catch (error) {
      this.logger.error('Failed to generate and send OTP', error);
      throw error;
    }
  }

  async verifyOTP(
    otpId: string,
    providedOTP: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; userId?: string; email?: string; purpose?: string }> {\n    try {\n      const otpRecord = this.otpStore.get(otpId);\n\n      if (!otpRecord) {\n        await this.auditLogService.logSuspiciousActivity(\n          'OTP verification attempted with invalid OTP ID',\n          undefined,\n          ipAddress,\n          { otpId, providedOTP: this.maskOTP(providedOTP) },\n        );\n        throw new BadRequestException('Invalid or expired OTP');\n      }\n\n      // Check if OTP is expired\n      if (new Date() > otpRecord.expiresAt) {\n        this.otpStore.delete(otpId);\n        await this.auditLogService.log(\n          AuditAction.LOGIN_FAILED,\n          AuditSeverity.MEDIUM,\n          'OTP verification failed: expired',\n          {\n            userId: otpRecord.userId,\n            metadata: {\n              purpose: otpRecord.purpose,\n              email: this.maskEmail(otpRecord.email),\n            },\n          },\n        );\n        throw new BadRequestException('OTP has expired');\n      }\n\n      // Check if OTP is already used\n      if (otpRecord.isUsed) {\n        await this.auditLogService.logSuspiciousActivity(\n          'Attempt to reuse already used OTP',\n          otpRecord.userId,\n          ipAddress,\n          {\n            otpId,\n            purpose: otpRecord.purpose,\n            email: this.maskEmail(otpRecord.email),\n          },\n        );\n        throw new BadRequestException('OTP has already been used');\n      }\n\n      // Increment attempts\n      otpRecord.attempts += 1;\n\n      // Check max attempts\n      if (otpRecord.attempts > this.MAX_ATTEMPTS) {\n        this.otpStore.delete(otpId);\n        await this.auditLogService.logSuspiciousActivity(\n          'OTP verification exceeded maximum attempts',\n          otpRecord.userId,\n          ipAddress,\n          {\n            otpId,\n            purpose: otpRecord.purpose,\n            attempts: otpRecord.attempts,\n          },\n        );\n        throw new BadRequestException('Too many failed attempts. Please request a new OTP.');\n      }\n\n      // Verify OTP\n      if (otpRecord.otp !== providedOTP) {\n        await this.auditLogService.log(\n          AuditAction.LOGIN_FAILED,\n          AuditSeverity.MEDIUM,\n          `OTP verification failed: incorrect code (attempt ${otpRecord.attempts}/${this.MAX_ATTEMPTS})`,\n          {\n            userId: otpRecord.userId,\n            metadata: {\n              purpose: otpRecord.purpose,\n              email: this.maskEmail(otpRecord.email),\n              attempts: otpRecord.attempts,\n            },\n          },\n        );\n        throw new BadRequestException(\n          `Invalid OTP. ${this.MAX_ATTEMPTS - otpRecord.attempts} attempts remaining.`,\n        );\n      }\n\n      // Mark OTP as used\n      otpRecord.isUsed = true;\n\n      // Log successful verification\n      await this.auditLogService.log(\n        AuditAction.LOGIN,\n        AuditSeverity.LOW,\n        `OTP verified successfully for ${otpRecord.purpose}`,\n        {\n          userId: otpRecord.userId,\n          metadata: {\n            purpose: otpRecord.purpose,\n            email: this.maskEmail(otpRecord.email),\n          },\n        },\n      );\n\n      this.logger.log(\n        `OTP verified successfully: ${otpRecord.purpose} for ${this.maskEmail(otpRecord.email)}`,\n      );\n\n      return {\n        success: true,\n        userId: otpRecord.userId !== 'pending' ? otpRecord.userId : undefined,\n        email: otpRecord.email,\n        purpose: otpRecord.purpose,\n      };\n    } catch (error) {\n      this.logger.error('OTP verification failed', error);\n      throw error;\n    }\n  }\n\n  async resendOTP(otpId: string): Promise<{ success: boolean; newOtpId: string; expiresIn: number }> {\n    try {\n      const otpRecord = this.otpStore.get(otpId);\n\n      if (!otpRecord) {\n        throw new BadRequestException('Invalid OTP ID');\n      }\n\n      // Delete old OTP\n      this.otpStore.delete(otpId);\n\n      // Generate new OTP\n      const result = await this.generateAndSendOTP(\n        otpRecord.email,\n        otpRecord.purpose,\n        otpRecord.userId !== 'pending' ? otpRecord.userId : undefined,\n      );\n\n      this.logger.log(`OTP resent for ${otpRecord.purpose}: ${this.maskEmail(otpRecord.email)}`);\n\n      return {\n        success: result.success,\n        newOtpId: result.otpId,\n        expiresIn: result.expiresIn,\n      };\n    } catch (error) {\n      this.logger.error('Failed to resend OTP', error);\n      throw error;\n    }\n  }\n\n  async invalidateOTP(otpId: string): Promise<void> {\n    const otpRecord = this.otpStore.get(otpId);\n    if (otpRecord) {\n      this.otpStore.delete(otpId);\n      this.logger.log(`OTP invalidated: ${otpId}`);\n    }\n  }\n\n  async invalidateUserOTPs(userId: string, purpose?: string): Promise<void> {\n    const toDelete: string[] = [];\n\n    for (const [otpId, record] of this.otpStore.entries()) {\n      if (record.userId === userId && (!purpose || record.purpose === purpose)) {\n        toDelete.push(otpId);\n      }\n    }\n\n    toDelete.forEach(otpId => this.otpStore.delete(otpId));\n    this.logger.log(`Invalidated ${toDelete.length} OTPs for user ${userId}`);\n  }\n\n  private generateOTP(): string {\n    // Generate cryptographically secure random OTP\n    const digits = '0123456789';\n    let otp = '';\n\n    for (let i = 0; i < this.OTP_LENGTH; i++) {\n      const randomIndex = crypto.randomInt(0, digits.length);\n      otp += digits[randomIndex];\n    }\n\n    return otp;\n  }\n\n  private generateOTPId(): string {\n    return crypto.randomUUID();\n  }\n\n  private maskEmail(email: string): string {\n    const [username, domain] = email.split('@');\n    const maskedUsername = username.length > 2 \n      ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]\n      : username;\n    return `${maskedUsername}@${domain}`;\n  }\n\n  private maskOTP(otp: string): string {\n    return otp.replace(/./g, '*');\n  }\n\n  private cleanupExpiredOTPs(): void {\n    const now = new Date();\n    const expired: string[] = [];\n\n    for (const [otpId, record] of this.otpStore.entries()) {\n      if (now > record.expiresAt) {\n        expired.push(otpId);\n      }\n    }\n\n    expired.forEach(otpId => this.otpStore.delete(otpId));\n\n    if (expired.length > 0) {\n      this.logger.log(`Cleaned up ${expired.length} expired OTPs`);\n    }\n  }\n\n  // Get OTP statistics for monitoring\n  getOTPStatistics(): {\n    total: number;\n    byPurpose: Record<string, number>;\n    expired: number;\n    used: number;\n  } {\n    const now = new Date();\n    const stats = {\n      total: this.otpStore.size,\n      byPurpose: {} as Record<string, number>,\n      expired: 0,\n      used: 0,\n    };\n\n    for (const record of this.otpStore.values()) {\n      // Count by purpose\n      stats.byPurpose[record.purpose] = (stats.byPurpose[record.purpose] || 0) + 1;\n\n      // Count expired\n      if (now > record.expiresAt) {\n        stats.expired++;\n      }\n\n      // Count used\n      if (record.isUsed) {\n        stats.used++;\n      }\n    }\n\n    return stats;\n  }\n}"