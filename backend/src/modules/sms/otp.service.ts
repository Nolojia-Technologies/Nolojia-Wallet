import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OtpEntity, OtpPurpose } from './entities/otp.entity';
import { SmsService } from './sms.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface GenerateOtpDto {
  userId: string;
  phoneNumber: string;
  purpose: OtpPurpose;
  metadata?: Record<string, any>;
}

export interface VerifyOtpDto {
  userId: string;
  phoneNumber: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  expiresAt?: Date;
  attemptsRemaining?: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly maxAttempts = 3;
  private readonly otpLength = 6;
  private readonly otpExpiryMinutes = 5;
  private readonly resendDelayMinutes = 1;

  constructor(
    @InjectRepository(OtpEntity)
    private otpRepository: Repository<OtpEntity>,
    private smsService: SmsService,
    private configService: ConfigService,
  ) {
    this.cleanupExpiredOtps();
  }

  private generateNumericOtp(length: number = this.otpLength): string {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
      const randomBytes = crypto.randomBytes(1);
      const randomIndex = randomBytes[0] % digits.length;
      otp += digits[randomIndex];
    }

    return otp;
  }

  private hashOtp(otp: string): string {
    const secret = this.configService.get<string>('OTP_SECRET') || 'default-otp-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(otp)
      .digest('hex');
  }

  async generateAndSendOtp(data: GenerateOtpDto): Promise<OtpResponse> {
    try {
      const recentOtp = await this.otpRepository.findOne({
        where: {
          userId: data.userId,
          phoneNumber: data.phoneNumber,
          purpose: data.purpose,
          isUsed: false,
          expiresAt: LessThan(new Date(Date.now() + this.resendDelayMinutes * 60 * 1000)),
        },
        order: { createdAt: 'DESC' },
      });

      if (recentOtp && new Date() < new Date(recentOtp.createdAt.getTime() + this.resendDelayMinutes * 60 * 1000)) {
        const timeToWait = Math.ceil(
          (new Date(recentOtp.createdAt.getTime() + this.resendDelayMinutes * 60 * 1000).getTime() - Date.now()) / 1000
        );
        throw new BadRequestException(
          `Please wait ${timeToWait} seconds before requesting a new OTP`
        );
      }

      await this.otpRepository.update(
        {
          userId: data.userId,
          phoneNumber: data.phoneNumber,
          purpose: data.purpose,
          isUsed: false,
        },
        { isUsed: true }
      );

      const otp = this.generateNumericOtp();
      const hashedOtp = this.hashOtp(otp);
      const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

      const otpEntity = this.otpRepository.create({
        userId: data.userId,
        phoneNumber: data.phoneNumber,
        otp: hashedOtp,
        purpose: data.purpose,
        expiresAt,
        attempts: 0,
        metadata: data.metadata,
      });

      await this.otpRepository.save(otpEntity);

      const message = this.getOtpMessage(otp, data.purpose);

      const smsResult = await this.smsService.sendSms({
        to: data.phoneNumber,
        message,
      });

      if (!smsResult.success) {
        await this.otpRepository.delete({ id: otpEntity.id });
        throw new Error(`Failed to send OTP: ${smsResult.error}`);
      }

      this.logger.log(`OTP sent successfully to ${data.phoneNumber} for ${data.purpose}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresAt,
        attemptsRemaining: this.maxAttempts,
      };
    } catch (error) {
      this.logger.error('Failed to generate and send OTP', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }

  async verifyOtp(data: VerifyOtpDto): Promise<OtpResponse> {
    try {
      const hashedOtp = this.hashOtp(data.otp);

      const otpEntity = await this.otpRepository.findOne({
        where: {
          userId: data.userId,
          phoneNumber: data.phoneNumber,
          purpose: data.purpose,
          isUsed: false,
        },
        order: { createdAt: 'DESC' },
      });

      if (!otpEntity) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      if (otpEntity.attempts >= this.maxAttempts) {
        await this.otpRepository.update({ id: otpEntity.id }, { isUsed: true });
        throw new UnauthorizedException('Maximum OTP attempts exceeded. Please request a new OTP.');
      }

      if (new Date() > otpEntity.expiresAt) {
        await this.otpRepository.update({ id: otpEntity.id }, { isUsed: true });
        throw new UnauthorizedException('OTP has expired. Please request a new one.');
      }

      if (otpEntity.otp !== hashedOtp) {
        await this.otpRepository.update(
          { id: otpEntity.id },
          { attempts: otpEntity.attempts + 1 }
        );

        const attemptsRemaining = this.maxAttempts - otpEntity.attempts - 1;

        if (attemptsRemaining === 0) {
          await this.otpRepository.update({ id: otpEntity.id }, { isUsed: true });
        }

        throw new UnauthorizedException(
          `Invalid OTP. ${attemptsRemaining} attempt(s) remaining.`
        );
      }

      await this.otpRepository.update({ id: otpEntity.id }, { isUsed: true, verifiedAt: new Date() });

      this.logger.log(`OTP verified successfully for ${data.phoneNumber}`);

      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      this.logger.error('Failed to verify OTP', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Failed to verify OTP');
    }
  }

  private getOtpMessage(otp: string, purpose: OtpPurpose): string {
    const appName = this.configService.get<string>('APP_NAME') || 'Nolojia Wallet';

    const messages = {
      [OtpPurpose.LOGIN]: `Your ${appName} login OTP is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes. Do not share this code.`,
      [OtpPurpose.SIGNUP]: `Welcome to ${appName}! Your verification OTP is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes.`,
      [OtpPurpose.TRANSACTION]: `Your ${appName} transaction OTP is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes. Do not share this code.`,
      [OtpPurpose.PASSWORD_RESET]: `Your ${appName} password reset OTP is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes.`,
      [OtpPurpose.PHONE_VERIFICATION]: `Your ${appName} phone verification OTP is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes.`,
      [OtpPurpose.TWO_FACTOR]: `Your ${appName} 2FA code is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes.`,
    };

    return messages[purpose] || `Your ${appName} OTP is: ${otp}. Valid for ${this.otpExpiryMinutes} minutes.`;
  }

  async cleanupExpiredOtps(): Promise<void> {
    try {
      const result = await this.otpRepository.delete({
        expiresAt: LessThan(new Date()),
      });

      if (result.affected > 0) {
        this.logger.log(`Cleaned up ${result.affected} expired OTP(s)`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired OTPs', error);
    }

    setTimeout(() => this.cleanupExpiredOtps(), 60 * 60 * 1000);
  }

  async getOtpHistory(userId: string, limit: number = 10): Promise<OtpEntity[]> {
    return this.otpRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['id', 'phoneNumber', 'purpose', 'isUsed', 'attempts', 'createdAt', 'verifiedAt', 'expiresAt'],
    });
  }

  async isPhoneVerified(userId: string, phoneNumber: string): Promise<boolean> {
    const verifiedOtp = await this.otpRepository.findOne({
      where: {
        userId,
        phoneNumber,
        purpose: OtpPurpose.PHONE_VERIFICATION,
        isUsed: true,
        verifiedAt: LessThan(new Date()),
      },
    });

    return !!verifiedOtp;
  }
}