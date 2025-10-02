import { Injectable } from '@nestjs/common';
import { SmsService } from '../sms.service';
import { OtpService } from '../otp.service';
import { NotificationService, NotificationType } from '../notification.service';
import { OtpPurpose } from '../entities/otp.entity';

/**
 * Example usage of SMS services in your application
 * This demonstrates how to use the SMS, OTP, and Notification services
 */
@Injectable()
export class SmsUsageExample {
  constructor(
    private readonly smsService: SmsService,
    private readonly otpService: OtpService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Example 1: Send OTP for user login
   */
  async sendLoginOtp(userId: string, phoneNumber: string) {
    try {
      const result = await this.otpService.generateAndSendOtp({
        userId,
        phoneNumber,
        purpose: OtpPurpose.LOGIN,
      });

      console.log('Login OTP sent:', result);
      return result;
    } catch (error) {
      console.error('Failed to send login OTP:', error);
      throw error;
    }
  }

  /**
   * Example 2: Verify OTP
   */
  async verifyUserOtp(userId: string, phoneNumber: string, otp: string) {
    try {
      const result = await this.otpService.verifyOtp({
        userId,
        phoneNumber,
        otp,
        purpose: OtpPurpose.LOGIN,
      });

      console.log('OTP verification result:', result);
      return result;
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw error;
    }
  }

  /**
   * Example 3: Send transaction notification
   */
  async notifyTransactionSuccess(
    phoneNumber: string,
    amount: number,
    recipient: string,
    reference: string,
  ) {
    try {
      const success = await this.notificationService.notifyTransactionSuccess(
        phoneNumber,
        amount,
        recipient,
        reference,
      );

      console.log('Transaction notification sent:', success);
      return success;
    } catch (error) {
      console.error('Failed to send transaction notification:', error);
      return false;
    }
  }

  /**
   * Example 4: Send wallet credit notification
   */
  async notifyWalletCredit(
    phoneNumber: string,
    amount: number,
    newBalance: number,
    reference?: string,
  ) {
    try {
      const success = await this.notificationService.notifyWalletCredit(
        phoneNumber,
        amount,
        newBalance,
        reference,
      );

      console.log('Wallet credit notification sent:', success);
      return success;
    } catch (error) {
      console.error('Failed to send wallet credit notification:', error);
      return false;
    }
  }

  /**
   * Example 5: Send low balance alert
   */
  async sendLowBalanceAlert(phoneNumber: string, currentBalance: number) {
    try {
      const success = await this.notificationService.notifyLowBalance(
        phoneNumber,
        currentBalance,
      );

      console.log('Low balance alert sent:', success);
      return success;
    } catch (error) {
      console.error('Failed to send low balance alert:', error);
      return false;
    }
  }

  /**
   * Example 6: Send custom SMS message
   */
  async sendCustomSms(phoneNumber: string, message: string) {
    try {
      const result = await this.smsService.sendSms({
        to: phoneNumber,
        message,
      });

      console.log('Custom SMS sent:', result);
      return result;
    } catch (error) {
      console.error('Failed to send custom SMS:', error);
      throw error;
    }
  }

  /**
   * Example 7: Send bulk SMS notifications
   */
  async sendBulkNotification(phoneNumbers: string[], message: string) {
    try {
      const result = await this.smsService.sendBulkSms(phoneNumbers, message);

      console.log('Bulk SMS sent:', result);
      return result;
    } catch (error) {
      console.error('Failed to send bulk SMS:', error);
      throw error;
    }
  }

  /**
   * Example 8: High-risk transaction OTP
   */
  async sendTransactionOtp(
    userId: string,
    phoneNumber: string,
    transactionAmount: number,
  ) {
    try {
      const result = await this.otpService.generateAndSendOtp({
        userId,
        phoneNumber,
        purpose: OtpPurpose.TRANSACTION,
        metadata: {
          amount: transactionAmount,
          timestamp: new Date().toISOString(),
        },
      });

      console.log('Transaction OTP sent:', result);
      return result;
    } catch (error) {
      console.error('Failed to send transaction OTP:', error);
      throw error;
    }
  }

  /**
   * Example 9: Send security alert
   */
  async sendSecurityAlert(phoneNumber: string, alertMessage: string) {
    try {
      const success = await this.notificationService.notifySecurityAlert(
        phoneNumber,
        alertMessage,
      );

      console.log('Security alert sent:', success);
      return success;
    } catch (error) {
      console.error('Failed to send security alert:', error);
      return false;
    }
  }

  /**
   * Example 10: Check SMS balance
   */
  async checkSmsBalance() {
    try {
      const balance = await this.smsService.getBalance();
      console.log('SMS Balance:', balance);
      return balance;
    } catch (error) {
      console.error('Failed to check SMS balance:', error);
      return null;
    }
  }
}

/**
 * Example usage in a transaction controller
 */
export class TransactionControllerExample {
  constructor(
    private readonly smsUsageExample: SmsUsageExample,
  ) {}

  async processHighValueTransaction(
    userId: string,
    phoneNumber: string,
    amount: number,
    recipient: string,
  ) {
    // Step 1: Send OTP for high-value transaction
    const otpResult = await this.smsUsageExample.sendTransactionOtp(
      userId,
      phoneNumber,
      amount,
    );

    if (!otpResult.success) {
      throw new Error('Failed to send OTP');
    }

    // Step 2: User provides OTP (simulated)
    const userProvidedOtp = '123456'; // This would come from user input

    // Step 3: Verify OTP
    const verificationResult = await this.smsUsageExample.verifyUserOtp(
      userId,
      phoneNumber,
      userProvidedOtp,
    );

    if (!verificationResult.success) {
      throw new Error('Invalid OTP');
    }

    // Step 4: Process transaction (simulated)
    const transactionReference = `TXN${Date.now()}`;

    // Step 5: Send success notification
    await this.smsUsageExample.notifyTransactionSuccess(
      phoneNumber,
      amount,
      recipient,
      transactionReference,
    );

    return {
      success: true,
      reference: transactionReference,
    };
  }
}