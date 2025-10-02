import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../../database/entities/transaction.entity';
import * as crypto from 'crypto';

interface BankAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  branchCode: string;
  swiftCode: string;
  iban?: string;
}

interface BankTransferDetails {
  transferId: string;
  bankAccount: BankAccount;
  reference: string;
  amount: number;
  currency: string;
  instructions: string[];
  expiresAt: string;
}

interface BankWebhookPayload {
  transferId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: number;
  reference: string;
  bankReference?: string;
  completedAt?: string;
  failureReason?: string;
}

@Injectable()
export class BankTransferService {
  private readonly logger = new Logger(BankTransferService.class);

  // Supported Kenyan banks
  private readonly supportedBanks = new Map<string, BankAccount>([
    ['KCB', {
      accountName: 'Nolojia Wallet Limited',
      accountNumber: '1234567890',
      bankName: 'Kenya Commercial Bank',
      bankCode: '01',
      branchCode: '091',
      swiftCode: 'KCBLKENX',
    }],
    ['EQUITY', {
      accountName: 'Nolojia Wallet Limited',
      accountNumber: '0987654321',
      bankName: 'Equity Bank Kenya',
      bankCode: '68',
      branchCode: '068',
      swiftCode: 'EQBLKENA',
    }],
    ['COOP', {
      accountName: 'Nolojia Wallet Limited',
      accountNumber: '5678901234',
      bankName: 'Co-operative Bank of Kenya',
      bankCode: '11',
      branchCode: '011',
      swiftCode: 'COOPKENX',
    }],
    ['ABSA', {
      accountName: 'Nolojia Wallet Limited',
      accountNumber: '4321098765',
      bankName: 'Absa Bank Kenya PLC',
      bankCode: '03',
      branchCode: '030',
      swiftCode: 'BARCKENX',
    }],
    ['STANDARD', {
      accountName: 'Nolojia Wallet Limited',
      accountNumber: '6789012345',
      bankName: 'Standard Chartered Bank Kenya',
      bankCode: '02',
      branchCode: '020',
      swiftCode: 'SCBLKENX',
    }],
  ]);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async generateBankTransferDetails(
    amount: number,
    userId: string,
    transactionId: string,
    preferredBank?: string
  ): Promise<BankTransferDetails> {
    try {
      // Validate amount
      this.validateTransferAmount(amount);

      // Select bank account (default to KCB if not specified or invalid)
      const bankKey = preferredBank && this.supportedBanks.has(preferredBank.toUpperCase())
        ? preferredBank.toUpperCase()
        : 'KCB';

      const bankAccount = this.supportedBanks.get(bankKey);

      // Generate unique reference
      const reference = this.generateTransferReference(userId, transactionId);

      // Calculate expiry (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const transferDetails: BankTransferDetails = {
        transferId: transactionId,
        bankAccount,
        reference,
        amount,
        currency: 'KES',
        instructions: this.generateInstructions(bankAccount, reference, amount),
        expiresAt,
      };

      this.logger.log(`Generated bank transfer details for transaction ${transactionId}, amount: ${amount} KES`);

      return transferDetails;

    } catch (error) {
      this.logger.error('Failed to generate bank transfer details', error);
      throw error;
    }
  }

  async verifyBankTransfer(reference: string, expectedAmount: number): Promise<boolean> {
    try {
      // In production, this would integrate with banking APIs or
      // check against received bank statements/webhooks

      // For now, we'll simulate verification based on reference format
      if (!this.isValidReference(reference)) {
        this.logger.warn(`Invalid reference format for verification: ${reference}`);
        return false;
      }

      // Simulate bank API call to verify payment
      // In real implementation, this would call bank's API or check transaction records
      const isVerified = await this.simulateBankVerification(reference, expectedAmount);

      if (isVerified) {
        this.logger.log(`Bank transfer verified successfully: ${reference}`);
      } else {
        this.logger.warn(`Bank transfer verification failed: ${reference}`);
      }

      return isVerified;

    } catch (error) {
      this.logger.error('Bank transfer verification failed', error);
      return false;
    }
  }

  async processBankWebhook(payload: BankWebhookPayload, signature: string): Promise<boolean> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(JSON.stringify(payload), signature)) {
        this.logger.error('Invalid bank webhook signature');
        return false;
      }

      // Validate payload
      if (!this.isValidWebhookPayload(payload)) {
        this.logger.error('Invalid bank webhook payload', payload);
        return false;
      }

      // Find the corresponding transaction
      const transaction = await this.transactionRepository.findOne({
        where: { id: payload.transferId }
      });

      if (!transaction) {
        this.logger.error(`Transaction not found for bank webhook: ${payload.transferId}`);
        return false;
      }

      // Update transaction status based on webhook
      await this.updateTransactionFromWebhook(transaction, payload);

      this.logger.log(`Bank webhook processed successfully for transaction: ${payload.transferId}`);
      return true;

    } catch (error) {
      this.logger.error('Failed to process bank webhook', error);
      return false;
    }
  }

  private validateTransferAmount(amount: number): void {
    if (amount < 100) {
      throw new BadRequestException('Minimum bank transfer amount is KES 100');
    }

    if (amount > 10000000) { // 10 million KES
      throw new BadRequestException('Amount exceeds bank transfer limit');
    }

    if (!Number.isInteger(amount)) {
      throw new BadRequestException('Bank transfer amount must be a whole number');
    }
  }

  private generateTransferReference(userId: string, transactionId: string): string {
    // Create a unique, traceable reference
    const timestamp = Date.now().toString().slice(-8);
    const userHash = crypto.createHash('md5').update(userId).digest('hex').slice(0, 4);
    const txnHash = crypto.createHash('md5').update(transactionId).digest('hex').slice(0, 4);

    return `NLJ${userHash.toUpperCase()}${txnHash.toUpperCase()}${timestamp}`;
  }

  private generateInstructions(bankAccount: BankAccount, reference: string, amount: number): string[] {
    return [
      `1. Log into your mobile banking app or visit a ${bankAccount.bankName} branch`,
      `2. Initiate a transfer to account number: ${bankAccount.accountNumber}`,
      `3. Account name: ${bankAccount.accountName}`,
      `4. Amount: KES ${amount.toLocaleString()}`,
      `5. Reference/Description: ${reference}`,
      `6. IMPORTANT: Use the exact reference provided above`,
      `7. Your wallet will be credited within 5-10 minutes after successful transfer`,
      `8. Keep your bank receipt for record purposes`,
      `9. Contact support if funds are not credited within 30 minutes`,
    ];
  }

  private isValidReference(reference: string): boolean {
    // Validate our reference format: NLJ[4chars][4chars][8digits]
    const referencePattern = /^NLJ[A-Z0-9]{4}[A-Z0-9]{4}\d{8}$/;
    return referencePattern.test(reference);
  }

  private async simulateBankVerification(reference: string, expectedAmount: number): Promise<boolean> {
    // Simulate bank API verification
    // In production, this would make actual calls to bank APIs

    // For demonstration, we'll randomly return true 80% of the time
    // after a simulated delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return Math.random() > 0.2;
  }

  private verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const webhookSecret = this.configService.get<string>('BANK_WEBHOOK_SECRET');

      if (!webhookSecret) {
        this.logger.error('Bank webhook secret not configured');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
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

  private isValidWebhookPayload(payload: BankWebhookPayload): boolean {
    const requiredFields = ['transferId', 'status', 'amount', 'reference'];

    for (const field of requiredFields) {
      if (!payload[field]) {
        return false;
      }
    }

    // Validate status values
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];
    if (!validStatuses.includes(payload.status)) {
      return false;
    }

    // Validate amount
    if (typeof payload.amount !== 'number' || payload.amount <= 0) {
      return false;
    }

    return true;
  }

  private async updateTransactionFromWebhook(
    transaction: Transaction,
    payload: BankWebhookPayload
  ): Promise<void> {
    switch (payload.status) {
      case 'COMPLETED':
        transaction.status = 'COMPLETED';
        transaction.metadata = {
          ...transaction.metadata,
          bankReference: payload.bankReference,
          completedAt: payload.completedAt || new Date().toISOString(),
        };
        break;

      case 'FAILED':
      case 'CANCELLED':
        transaction.status = 'FAILED';
        transaction.metadata = {
          ...transaction.metadata,
          failureReason: payload.failureReason || `Transfer ${payload.status.toLowerCase()}`,
        };
        break;

      case 'PENDING':
        // Keep as pending
        break;
    }

    await this.transactionRepository.save(transaction);
  }

  // Get supported banks list
  getSupportedBanks(): Array<{ code: string; name: string; swiftCode: string }> {
    return Array.from(this.supportedBanks.entries()).map(([code, account]) => ({
      code,
      name: account.bankName,
      swiftCode: account.swiftCode,
    }));
  }

  // Check if bank transfer is available
  isBankTransferAvailable(): boolean {
    // Check business hours, system maintenance, etc.
    const now = new Date();
    const hour = now.getHours();

    // Available 24/7 for now, but can be restricted based on banking hours
    return true;
  }
}