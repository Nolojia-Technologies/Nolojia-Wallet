import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EmailVerification, VerificationType } from '../../database/entities/email-verification.entity';
import { User } from '../../database/entities/user.entity';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface CreateVerificationDto {
  userId: string;
  email: string;
  type: VerificationType;
  expiryHours?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface VerifyTokenDto {
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  user?: Partial<User>;
  expiresAt?: Date;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(EmailVerification)
    private verificationRepository: Repository<EmailVerification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    // Clean up expired tokens every hour
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
  }

  async createEmailVerification(data: CreateVerificationDto): Promise<VerificationResponse> {
    try {
      // Invalidate any existing unused tokens for this user and type
      await this.verificationRepository.update(
        {
          userId: data.userId,
          email: data.email,
          type: data.type,
          isUsed: false,
        },
        { isUsed: true }
      );

      // Generate unique token
      const token = this.generateVerificationToken();

      // Set expiry time
      const expiryHours = data.expiryHours || this.getDefaultExpiry(data.type);
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      // Create verification record
      const verification = this.verificationRepository.create({
        userId: data.userId,
        email: data.email,
        token,
        type: data.type,
        expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
      });

      await this.verificationRepository.save(verification);

      // Get user details for email
      const user = await this.userRepository.findOne({ where: { id: data.userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Send verification email
      let emailSent = false;
      if (data.type === VerificationType.EMAIL_VERIFICATION) {
        const emailResult = await this.emailService.sendVerificationEmail(
          data.email,
          user.firstName,
          token
        );
        emailSent = emailResult.success;
      } else if (data.type === VerificationType.PASSWORD_RESET) {
        const emailResult = await this.emailService.sendPasswordResetEmail(
          data.email,
          user.firstName,
          token
        );
        emailSent = emailResult.success;
      }

      if (!emailSent) {
        this.logger.warn(`Failed to send ${data.type} email to ${data.email}`);
      }

      this.logger.log(`${data.type} verification created for user ${data.userId}`);

      return {
        success: true,
        message: 'Verification email sent successfully',
        expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to create email verification', error);
      throw new BadRequestException('Failed to create verification');
    }
  }

  async verifyToken(data: VerifyTokenDto): Promise<VerificationResponse> {
    try {
      const verification = await this.verificationRepository.findOne({
        where: { token: data.token, isUsed: false },
        relations: ['user'],
      });

      if (!verification) {
        throw new UnauthorizedException('Invalid or expired verification token');
      }

      // Check if token has expired
      if (new Date() > verification.expiresAt) {
        await this.verificationRepository.update({ id: verification.id }, { isUsed: true });
        throw new UnauthorizedException('Verification token has expired');
      }

      // Mark token as used
      await this.verificationRepository.update(
        { id: verification.id },
        {
          isUsed: true,
          usedAt: new Date(),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        }
      );

      // Update user based on verification type
      const user = verification.user;
      const updateData: Partial<User> = {};

      switch (verification.type) {
        case VerificationType.EMAIL_VERIFICATION:
          updateData.isEmailVerified = true;
          updateData.emailVerifiedAt = new Date();
          updateData.isVerified = true; // Mark overall verification as true
          break;
        case VerificationType.PHONE_VERIFICATION:
          updateData.isPhoneVerified = true;
          updateData.phoneVerifiedAt = new Date();
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await this.userRepository.update({ id: user.id }, updateData);
      }

      // Send welcome email after email verification
      if (verification.type === VerificationType.EMAIL_VERIFICATION) {
        await this.emailService.sendWelcomeEmail(user.email, user.firstName);
      }

      this.logger.log(`${verification.type} verified successfully for user ${user.id}`);

      return {
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: updateData.isEmailVerified || user.isEmailVerified,
          isPhoneVerified: updateData.isPhoneVerified || user.isPhoneVerified,
        },
      };
    } catch (error) {
      this.logger.error('Failed to verify token', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new BadRequestException('Failed to verify token');
    }
  }

  async resendVerification(
    email: string,
    type: VerificationType,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<VerificationResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if already verified
      if (type === VerificationType.EMAIL_VERIFICATION && user.isEmailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      // Check rate limiting - only allow resend every 5 minutes
      const recentVerification = await this.verificationRepository.findOne({
        where: {
          userId: user.id,
          email,
          type,
          createdAt: LessThan(new Date(Date.now() - 5 * 60 * 1000)), // 5 minutes ago
        },
        order: { createdAt: 'DESC' },
      });

      if (recentVerification && !recentVerification.isUsed) {
        const timeLeft = Math.ceil(
          (recentVerification.createdAt.getTime() + 5 * 60 * 1000 - Date.now()) / 1000
        );
        throw new BadRequestException(
          `Please wait ${timeLeft} seconds before requesting another verification email`
        );
      }

      return this.createEmailVerification({
        userId: user.id,
        email,
        type,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      this.logger.error('Failed to resend verification', error);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to resend verification');
    }
  }

  async getVerificationStatus(userId: string): Promise<{
    emailVerified: boolean;
    phoneVerified: boolean;
    kycVerified: boolean;
    pendingVerifications: string[];
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const pendingVerifications = await this.verificationRepository.find({
      where: {
        userId,
        isUsed: false,
        expiresAt: LessThan(new Date()),
      },
      select: ['type'],
    });

    return {
      emailVerified: user.isEmailVerified,
      phoneVerified: user.isPhoneVerified,
      kycVerified: user.isKycVerified,
      pendingVerifications: pendingVerifications.map(v => v.type),
    };
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getDefaultExpiry(type: VerificationType): number {
    switch (type) {
      case VerificationType.EMAIL_VERIFICATION:
        return 24; // 24 hours
      case VerificationType.PASSWORD_RESET:
        return 0.5; // 30 minutes
      case VerificationType.PHONE_VERIFICATION:
        return 1; // 1 hour
      default:
        return 24;
    }
  }

  private async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.verificationRepository.delete({
        expiresAt: LessThan(new Date()),
      });

      if (result.affected > 0) {
        this.logger.log(`Cleaned up ${result.affected} expired verification token(s)`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens', error);
    }
  }

  async validatePasswordResetToken(token: string): Promise<{ valid: boolean; user?: User }> {
    try {
      const verification = await this.verificationRepository.findOne({
        where: {
          token,
          type: VerificationType.PASSWORD_RESET,
          isUsed: false,
          expiresAt: LessThan(new Date()),
        },
        relations: ['user'],
      });

      return {
        valid: !!verification,
        user: verification?.user,
      };
    } catch (error) {
      this.logger.error('Failed to validate password reset token', error);
      return { valid: false };
    }
  }

  async markPasswordResetAsUsed(token: string): Promise<void> {
    await this.verificationRepository.update(
      {
        token,
        type: VerificationType.PASSWORD_RESET,
        isUsed: false,
      },
      {
        isUsed: true,
        usedAt: new Date(),
      }
    );
  }
}