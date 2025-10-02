import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

export interface SmsOptions {
  to: string | string[];
  message: string;
  from?: string;
  enqueue?: boolean;
}

export interface SmsResponse {
  success: boolean;
  messageId?: string;
  cost?: string;
  error?: string;
  recipients?: any[];
  data?: any;
}

export interface AfricasTalkingApiResponse {
  SMSMessageData: {
    Message: string;
    Recipients: Array<{
      statusCode: number;
      number: string;
      status: string;
      cost: string;
      messageId: string;
    }>;
  };
}

export interface BalanceResponse {
  UserData: {
    balance: string;
  };
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly apiKey: string;
  private readonly senderId: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('AFRICASTALKING_BASE_URL') || 'https://api.africastalking.com/version1';
    this.username = this.configService.get<string>('AFRICASTALKING_USERNAME') || 'sandbox';
    this.apiKey = this.configService.get<string>('AFRICASTALKING_API_KEY');
    this.senderId = this.configService.get<string>('AFRICASTALKING_SENDER_ID') || 'NOLOJIA';

    if (!this.apiKey) {
      this.logger.error('Africa\'s Talking API key not configured');
    } else {
      this.logger.log(`SMS service initialized with username: ${this.username}`);
    }
  }

  private getHeaders() {
    return {
      'apiKey': this.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    };
  }

  private formatPayload(data: Record<string, any>): string {
    return Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
  }

  async sendSms(options: SmsOptions): Promise<SmsResponse> {
    if (!this.apiKey) {
      this.logger.error('SMS service not configured - missing API key');
      return {
        success: false,
        error: 'SMS service not configured. Please check API key.',
      };
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const formattedRecipients = recipients.map(phone => this.formatPhoneNumber(phone));

      const payload = {
        username: this.username,
        to: formattedRecipients.join(','),
        message: options.message,
        from: options.from || this.senderId,
        enqueue: options.enqueue !== undefined ? options.enqueue ? '1' : '0' : '1',
      };

      this.logger.log(`Sending SMS to ${formattedRecipients.join(', ')}`);

      const response: AxiosResponse<AfricasTalkingApiResponse> = await axios.post(
        `${this.baseUrl}/messaging`,
        this.formatPayload(payload),
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      const responseData = response.data;

      if (responseData.SMSMessageData && responseData.SMSMessageData.Recipients && responseData.SMSMessageData.Recipients.length > 0) {
        const recipient = responseData.SMSMessageData.Recipients[0];

        if (recipient.statusCode === 101 || recipient.status === 'Success') {
          this.logger.log(`SMS sent successfully. MessageId: ${recipient.messageId}`);
          return {
            success: true,
            messageId: recipient.messageId,
            cost: recipient.cost,
            recipients: responseData.SMSMessageData.Recipients,
            data: responseData,
          };
        } else {
          this.logger.warn(`SMS sending failed: ${recipient.status}`);
          return {
            success: false,
            error: recipient.status,
            recipients: responseData.SMSMessageData.Recipients,
            data: responseData,
          };
        }
      } else {
        this.logger.error('No recipients in response', responseData);
        return {
          success: false,
          error: 'No recipients processed',
          data: responseData,
        };
      }
    } catch (error) {
      this.logger.error('Failed to send SMS', error.response?.data || error.message);

      if (error.response) {
        return {
          success: false,
          error: `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`,
          data: error.response.data,
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }

  async sendBulkSms(recipients: string[], message: string): Promise<SmsResponse> {
    return this.sendSms({ to: recipients, message });
  }

  async getBalance(): Promise<{ balance: string; currency: string } | null> {
    if (!this.apiKey) {
      this.logger.error('SMS service not configured - missing API key');
      return null;
    }

    try {
      const response: AxiosResponse<BalanceResponse> = await axios.get(
        `${this.baseUrl}/user?username=${this.username}`,
        {
          headers: {
            'apiKey': this.apiKey,
            'Accept': 'application/json',
          },
          timeout: 15000,
        }
      );

      return {
        balance: response.data.UserData.balance,
        currency: 'KSH',
      };
    } catch (error) {
      this.logger.error('Failed to fetch balance', error.response?.data || error.message);
      return null;
    }
  }

  formatPhoneNumber(phoneNumber: string, countryCode: string = '254'): string {
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle Kenyan number formats:
    // 0722123456 -> 722123456 -> 254722123456
    // 722123456 -> 254722123456
    // 254722123456 -> 254722123456
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // If it doesn't start with country code, add it
    if (!cleaned.startsWith(countryCode)) {
      cleaned = countryCode + cleaned;
    }

    return `+${cleaned}`;
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    // Kenyan phone numbers: +254XXXXXXXXX (9 digits after country code)
    // Valid formats: +254722123456, 254722123456, 0722123456, 722123456
    const kenyanPhoneRegex = /^(\+?254|0)?([17]\d{8})$/;
    const cleaned = phoneNumber.replace(/\s+/g, '');
    return kenyanPhoneRegex.test(cleaned);
  }
}