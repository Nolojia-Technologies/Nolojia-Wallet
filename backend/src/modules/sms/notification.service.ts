import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ConfigService } from '@nestjs/config';

export enum NotificationType {
  WALLET_CREDIT = 'WALLET_CREDIT',
  WALLET_DEBIT = 'WALLET_DEBIT',
  TRANSACTION_SUCCESS = 'TRANSACTION_SUCCESS',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  LOW_BALANCE = 'LOW_BALANCE',
  PAYMENT_REQUEST = 'PAYMENT_REQUEST',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  ACCOUNT_SECURITY = 'ACCOUNT_SECURITY',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  LOGIN_ALERT = 'LOGIN_ALERT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  WITHDRAWAL_SUCCESS = 'WITHDRAWAL_SUCCESS',
  DEPOSIT_SUCCESS = 'DEPOSIT_SUCCESS',
  LOAN_APPROVED = 'LOAN_APPROVED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  LOAN_PAYMENT_DUE = 'LOAN_PAYMENT_DUE',
  ESCROW_CREATED = 'ESCROW_CREATED',
  ESCROW_RELEASED = 'ESCROW_RELEASED',
  DISPUTE_RAISED = 'DISPUTE_RAISED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
}

export interface NotificationData {
  phoneNumber: string;
  type: NotificationType;
  userId?: string;
  data: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly appName: string;
  private readonly minimumBalanceThreshold: number;

  constructor(
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
  ) {
    this.appName = this.configService.get<string>('APP_NAME') || 'Nolojia Wallet';
    this.minimumBalanceThreshold = this.configService.get<number>('MINIMUM_BALANCE_THRESHOLD') || 100;
  }

  async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      const message = this.getMessageTemplate(notification.type, notification.data);

      const result = await this.smsService.sendSms({
        to: notification.phoneNumber,
        message,
      });

      if (result.success) {
        this.logger.log(
          `${notification.type} notification sent to ${notification.phoneNumber}`,
        );
      } else {
        this.logger.warn(
          `Failed to send ${notification.type} notification to ${notification.phoneNumber}: ${result.error}`,
        );
      }

      return result.success;
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`, error);
      return false;
    }
  }

  async sendBulkNotifications(
    phoneNumbers: string[],
    type: NotificationType,
    data: Record<string, any>,
  ): Promise<{ successful: number; failed: number }> {
    const message = this.getMessageTemplate(type, data);

    const result = await this.smsService.sendBulkSms(phoneNumbers, message);

    const successful = result.recipients?.filter((r) => r.status === 'Success').length || 0;
    const failed = phoneNumbers.length - successful;

    this.logger.log(
      `Bulk ${type} notification: ${successful} successful, ${failed} failed`,
    );

    return { successful, failed };
  }

  private getMessageTemplate(type: NotificationType, data: Record<string, any>): string {
    const templates: Record<NotificationType, string> = {
      [NotificationType.WALLET_CREDIT]:
        `${this.appName}: Your wallet has been credited with ${data.currency || 'KSH'} ${data.amount}. New balance: ${data.currency || 'KSH'} ${data.balance}. Ref: ${data.reference || 'N/A'}`,

      [NotificationType.WALLET_DEBIT]:
        `${this.appName}: ${data.currency || 'KSH'} ${data.amount} has been debited from your wallet. New balance: ${data.currency || 'KSH'} ${data.balance}. Ref: ${data.reference || 'N/A'}`,

      [NotificationType.TRANSACTION_SUCCESS]:
        `${this.appName}: Your transaction of ${data.currency || 'KSH'} ${data.amount} to ${data.recipient} was successful. Ref: ${data.reference}`,

      [NotificationType.TRANSACTION_FAILED]:
        `${this.appName}: Your transaction of ${data.currency || 'KSH'} ${data.amount} to ${data.recipient} failed. ${data.reason || 'Please try again.'}`,

      [NotificationType.LOW_BALANCE]:
        `${this.appName}: Your wallet balance (${data.currency || 'KSH'} ${data.balance}) is below the minimum threshold. Please top up your wallet.`,

      [NotificationType.PAYMENT_REQUEST]:
        `${this.appName}: ${data.sender} has requested ${data.currency || 'KSH'} ${data.amount} from you. Open the app to respond.`,

      [NotificationType.PAYMENT_RECEIVED]:
        `${this.appName}: You have received ${data.currency || 'KSH'} ${data.amount} from ${data.sender}. New balance: ${data.currency || 'KSH'} ${data.balance}`,

      [NotificationType.ACCOUNT_SECURITY]:
        `${this.appName} Security Alert: ${data.message}. If this wasn't you, please secure your account immediately.`,

      [NotificationType.KYC_APPROVED]:
        `${this.appName}: Congratulations! Your KYC verification has been approved. You now have full access to all features.`,

      [NotificationType.KYC_REJECTED]:
        `${this.appName}: Your KYC verification was unsuccessful. Reason: ${data.reason || 'Invalid documents'}. Please try again.`,

      [NotificationType.LOGIN_ALERT]:
        `${this.appName}: New login to your account from ${data.device || 'unknown device'} at ${data.time}. If this wasn't you, secure your account.`,

      [NotificationType.PASSWORD_CHANGED]:
        `${this.appName}: Your password has been changed successfully. If you didn't make this change, contact support immediately.`,

      [NotificationType.WITHDRAWAL_SUCCESS]:
        `${this.appName}: Withdrawal of ${data.currency || 'KSH'} ${data.amount} to ${data.method} successful. Ref: ${data.reference}`,

      [NotificationType.DEPOSIT_SUCCESS]:
        `${this.appName}: Deposit of ${data.currency || 'KSH'} ${data.amount} successful. New balance: ${data.currency || 'KSH'} ${data.balance}`,

      [NotificationType.LOAN_APPROVED]:
        `${this.appName}: Your loan application of ${data.currency || 'KSH'} ${data.amount} has been approved! Funds will be disbursed shortly.`,

      [NotificationType.LOAN_DISBURSED]:
        `${this.appName}: Loan of ${data.currency || 'KSH'} ${data.amount} has been disbursed to your wallet. Repayment due: ${data.dueDate}`,

      [NotificationType.LOAN_PAYMENT_DUE]:
        `${this.appName}: Reminder: Your loan payment of ${data.currency || 'KSH'} ${data.amount} is due on ${data.dueDate}.`,

      [NotificationType.ESCROW_CREATED]:
        `${this.appName}: Escrow of ${data.currency || 'KSH'} ${data.amount} created for transaction with ${data.party}. Ref: ${data.reference}`,

      [NotificationType.ESCROW_RELEASED]:
        `${this.appName}: Escrow funds of ${data.currency || 'KSH'} ${data.amount} have been released. Transaction complete.`,

      [NotificationType.DISPUTE_RAISED]:
        `${this.appName}: A dispute has been raised for transaction ${data.reference}. Our team will review and contact you soon.`,

      [NotificationType.DISPUTE_RESOLVED]:
        `${this.appName}: Dispute for transaction ${data.reference} has been resolved. ${data.resolution || 'Check app for details.'}`,
    };

    return templates[type] || `${this.appName}: ${data.message || 'You have a new notification.'}`;
  }

  async notifyWalletCredit(
    phoneNumber: string,
    amount: number,
    balance: number,
    reference?: string,
    currency: string = 'KSH',
  ): Promise<boolean> {
    return this.sendNotification({
      phoneNumber,
      type: NotificationType.WALLET_CREDIT,
      data: { amount, balance, reference, currency },
    });
  }

  async notifyWalletDebit(
    phoneNumber: string,
    amount: number,
    balance: number,
    reference?: string,
    currency: string = 'KSH',
  ): Promise<boolean> {
    return this.sendNotification({
      phoneNumber,
      type: NotificationType.WALLET_DEBIT,
      data: { amount, balance, reference, currency },
    });
  }

  async notifyTransactionSuccess(
    phoneNumber: string,
    amount: number,
    recipient: string,
    reference: string,
    currency: string = 'KSH',
  ): Promise<boolean> {
    return this.sendNotification({
      phoneNumber,
      type: NotificationType.TRANSACTION_SUCCESS,
      data: { amount, recipient, reference, currency },
    });
  }

  async notifyLowBalance(
    phoneNumber: string,
    balance: number,
    currency: string = 'KSH',
  ): Promise<boolean> {
    if (balance >= this.minimumBalanceThreshold) {
      return false;
    }

    return this.sendNotification({
      phoneNumber,
      type: NotificationType.LOW_BALANCE,
      data: { balance, currency },
    });
  }

  async notifySecurityAlert(
    phoneNumber: string,
    message: string,
  ): Promise<boolean> {
    return this.sendNotification({
      phoneNumber,
      type: NotificationType.ACCOUNT_SECURITY,
      data: { message },
    });
  }

  async notifyLoginAlert(
    phoneNumber: string,
    device: string,
    time: string,
  ): Promise<boolean> {
    return this.sendNotification({
      phoneNumber,
      type: NotificationType.LOGIN_ALERT,
      data: { device, time },
    });
  }

  async notifyKycStatus(
    phoneNumber: string,
    approved: boolean,
    reason?: string,
  ): Promise<boolean> {
    return this.sendNotification({
      phoneNumber,
      type: approved ? NotificationType.KYC_APPROVED : NotificationType.KYC_REJECTED,
      data: { reason },
    });
  }

  async notifyLoanApproval(
    phoneNumber: string,
    amount: number,
    currency: string = 'KSH',
  ): Promise<boolean> {
    return this.sendNotification({
      phoneNumber,
      type: NotificationType.LOAN_APPROVED,
      data: { amount, currency },
    });
  }

  async notifyLoanDisbursement(
    phoneNumber: string,
    amount: number,
    dueDate: string,
    currency: string = 'KSH',
  ): Promise<boolean> {
    return this.sendNotification({
      phoneNumber,
      type: NotificationType.LOAN_DISBURSED,
      data: { amount, dueDate, currency },
    });
  }

  async notifyPaymentDue(
    phoneNumber: string,
    amount: number,
    dueDate: string,
    currency: string = 'KSH',
  ): Promise<boolean> {
    return this.sendNotification({
      phoneNumber,
      type: NotificationType.LOAN_PAYMENT_DUE,
      data: { amount, dueDate, currency },
    });
  }
}