import { Controller, Post, Body, Get } from '@nestjs/common';
import { SmsService } from './sms.service';
import { OtpService } from './otp.service';
import { NotificationService } from './notification.service';
import { OtpPurpose } from './entities/otp.entity';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('SMS Test')
@Controller('api/sms-test')
export class SmsTestController {
  constructor(
    private readonly smsService: SmsService,
    private readonly otpService: OtpService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('send-sms')
  @ApiOperation({ summary: 'Test SMS sending' })
  async testSendSms(@Body() body: { phoneNumber: string; message: string }) {
    try {
      const result = await this.smsService.sendSms({
        to: body.phoneNumber,
        message: body.message,
      });

      return {
        success: result.success,
        message: result.success ? 'SMS sent successfully' : 'Failed to send SMS',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error sending SMS',
        error: error.message,
      };
    }
  }

  @Post('send-test-otp')
  @ApiOperation({ summary: 'Test OTP generation and sending' })
  async testSendOtp(@Body() body: { phoneNumber: string; purpose?: string }) {
    try {
      const testUserId = `test_${Date.now()}`;
      const purpose = (body.purpose as OtpPurpose) || OtpPurpose.PHONE_VERIFICATION;

      const result = await this.otpService.generateAndSendOtp({
        userId: testUserId,
        phoneNumber: body.phoneNumber,
        purpose,
      });

      return {
        success: result.success,
        message: result.message,
        testUserId,
        expiresAt: result.expiresAt,
        attemptsRemaining: result.attemptsRemaining,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error sending OTP',
        error: error.message,
      };
    }
  }

  @Post('verify-test-otp')
  @ApiOperation({ summary: 'Test OTP verification' })
  async testVerifyOtp(@Body() body: { phoneNumber: string; otp: string; testUserId: string; purpose?: string }) {
    try {
      const purpose = (body.purpose as OtpPurpose) || OtpPurpose.PHONE_VERIFICATION;

      const result = await this.otpService.verifyOtp({
        userId: body.testUserId,
        phoneNumber: body.phoneNumber,
        otp: body.otp,
        purpose,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error verifying OTP',
        error: error.message,
      };
    }
  }

  @Post('send-notification')
  @ApiOperation({ summary: 'Test notification sending' })
  async testSendNotification(@Body() body: {
    phoneNumber: string;
    type: 'credit' | 'debit' | 'transaction' | 'low_balance' | 'security';
    data?: any;
  }) {
    try {
      let result = false;

      switch (body.type) {
        case 'credit':
          result = await this.notificationService.notifyWalletCredit(
            body.phoneNumber,
            body.data?.amount || 1000,
            body.data?.balance || 5000,
            body.data?.reference || 'TEST001',
          );
          break;

        case 'debit':
          result = await this.notificationService.notifyWalletDebit(
            body.phoneNumber,
            body.data?.amount || 500,
            body.data?.balance || 4500,
            body.data?.reference || 'TEST002',
          );
          break;

        case 'transaction':
          result = await this.notificationService.notifyTransactionSuccess(
            body.phoneNumber,
            body.data?.amount || 2000,
            body.data?.recipient || 'John Doe',
            body.data?.reference || 'TXN001',
          );
          break;

        case 'low_balance':
          result = await this.notificationService.notifyLowBalance(
            body.phoneNumber,
            body.data?.balance || 50,
          );
          break;

        case 'security':
          result = await this.notificationService.notifySecurityAlert(
            body.phoneNumber,
            body.data?.message || 'Suspicious login detected',
          );
          break;

        default:
          throw new Error('Invalid notification type');
      }

      return {
        success: result,
        message: result ? 'Notification sent successfully' : 'Failed to send notification',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error sending notification',
        error: error.message,
      };
    }
  }

  @Get('balance')
  @ApiOperation({ summary: 'Check SMS balance' })
  async checkBalance() {
    try {
      const balance = await this.smsService.getBalance();

      return {
        success: true,
        data: balance,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error checking balance',
        error: error.message,
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check SMS service health' })
  async healthCheck() {
    return {
      success: true,
      message: 'SMS service is running',
      timestamp: new Date().toISOString(),
      services: {
        sms: 'active',
        otp: 'active',
        notification: 'active',
      },
    };
  }
}