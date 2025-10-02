import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as https from 'https';

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortCode: string;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
  timeoutUrl: string;
}

interface MpesaTokenResponse {
  access_token: string;
  expires_in: string;
}

interface STKPushRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: string;
  Amount: string;
  PartyA: string;
  PartyB: string;
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly config: MpesaConfig;
  private readonly baseUrl: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(private configService: ConfigService) {
    this.config = {
      consumerKey: this.configService.get<string>('MPESA_CONSUMER_KEY'),
      consumerSecret: this.configService.get<string>('MPESA_CONSUMER_SECRET'),
      passkey: this.configService.get<string>('MPESA_PASSKEY'),
      shortCode: this.configService.get<string>('MPESA_SHORTCODE'),
      environment: this.configService.get<string>('MPESA_ENVIRONMENT') as 'sandbox' | 'production' || 'sandbox',
      callbackUrl: this.configService.get<string>('MPESA_CALLBACK_URL'),
      timeoutUrl: this.configService.get<string>('MPESA_TIMEOUT_URL'),
    };

    this.baseUrl = this.config.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';

    // Validate configuration
    this.validateConfig();
  }

  private validateConfig(): void {
    const requiredFields = ['consumerKey', 'consumerSecret', 'passkey', 'shortCode', 'callbackUrl'];

    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`Missing required M-Pesa configuration: ${field}`);
      }
    }

    // Validate phone number format for shortCode
    if (!/^\d{5,6}$/.test(this.config.shortCode)) {
      throw new Error('Invalid M-Pesa shortcode format');
    }
  }

  async getAccessToken(): Promise<string> {
    // Check if token is cached and not expired
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    try {
      const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');

      const response = await this.makeHttpRequest('GET', '/oauth/v1/generate?grant_type=client_credentials', {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      });

      const tokenData: MpesaTokenResponse = JSON.parse(response);

      // Cache token with 5 minutes buffer before expiry
      const expiresIn = parseInt(tokenData.expires_in) * 1000; // Convert to milliseconds
      this.tokenCache = {
        token: tokenData.access_token,
        expiresAt: Date.now() + expiresIn - 300000, // 5 minutes buffer
      };

      this.logger.log('M-Pesa access token obtained successfully');
      return tokenData.access_token;

    } catch (error) {
      this.logger.error('Failed to get M-Pesa access token', error);
      throw new InternalServerErrorException('Failed to authenticate with M-Pesa');
    }
  }

  async initiateSTKPush(phoneNumber: string, amount: number, transactionId: string): Promise<STKPushResponse> {
    try {
      // Validate inputs
      this.validatePhoneNumber(phoneNumber);
      this.validateAmount(amount);

      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      // Format phone number to international format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const stkPushRequest: STKPushRequest = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount).toString(),
        PartyA: formattedPhone,
        PartyB: this.config.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: `${this.config.callbackUrl}/mpesa`,
        AccountReference: `NOLOJIA-${transactionId}`,
        TransactionDesc: 'Nolojia Wallet Top-up',
      };

      this.logger.log(`Initiating STK push for phone: ${this.maskPhoneNumber(formattedPhone)}, amount: ${amount}`);

      const response = await this.makeHttpRequest('POST', '/mpesa/stkpush/v1/processrequest', {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }, JSON.stringify(stkPushRequest));

      const stkResponse: STKPushResponse = JSON.parse(response);

      if (stkResponse.ResponseCode === '0') {
        this.logger.log(`STK push initiated successfully: ${stkResponse.CheckoutRequestID}`);
        return stkResponse;
      } else {
        this.logger.error(`STK push failed: ${stkResponse.ResponseDescription}`);
        throw new BadRequestException(`M-Pesa transaction failed: ${stkResponse.ResponseDescription}`);
      }

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('STK push initiation failed', error);
      throw new InternalServerErrorException('Failed to initiate M-Pesa payment');
    }
  }

  async querySTKPushStatus(checkoutRequestId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const queryRequest = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await this.makeHttpRequest('POST', '/mpesa/stkpushquery/v1/query', {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }, JSON.stringify(queryRequest));

      return JSON.parse(response);

    } catch (error) {
      this.logger.error('STK push query failed', error);
      throw new InternalServerErrorException('Failed to query M-Pesa transaction status');
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // In production, M-Pesa sends signed webhooks
    // For now, we'll implement basic validation
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.consumerSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      return false;
    }
  }

  private validatePhoneNumber(phoneNumber: string): void {
    // Kenyan phone number validation
    const phoneRegex = /^(\+254|254|0)([7][0-9]{8})$/;

    if (!phoneRegex.test(phoneNumber)) {
      throw new BadRequestException('Invalid Kenyan phone number format');
    }
  }

  private validateAmount(amount: number): void {
    if (amount < 1) {
      throw new BadRequestException('Amount must be at least KES 1');
    }

    if (amount > 70000) {
      throw new BadRequestException('Amount exceeds M-Pesa transaction limit (KES 70,000)');
    }

    if (!Number.isInteger(amount)) {
      throw new BadRequestException('Amount must be a whole number');
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Convert to format 254XXXXXXXXX
    let formatted = phoneNumber.replace(/\s+/g, ''); // Remove spaces

    if (formatted.startsWith('+254')) {
      formatted = formatted.substring(1);
    } else if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (!formatted.startsWith('254')) {
      formatted = '254' + formatted;
    }

    return formatted;
  }

  private generateTimestamp(): string {
    return new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
  }

  private generatePassword(timestamp: string): string {
    const data = this.config.shortCode + this.config.passkey + timestamp;
    return Buffer.from(data).toString('base64');
  }

  private maskPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/(\d{3})\d{6}(\d{3})/, '$1****$2');
  }

  private makeHttpRequest(method: string, path: string, headers: any, body?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl.replace('https://', ''),
        port: 443,
        path: path,
        method: method,
        headers: {
          ...headers,
          'User-Agent': 'Nolojia-Wallet/1.0',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.setTimeout(30000); // 30 seconds timeout

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }
}