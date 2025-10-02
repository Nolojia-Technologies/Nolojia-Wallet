import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { User } from '../../database/entities/user.entity';
import { InitiateTopUpDto } from './dto/initiate-topup.dto';
import { VerifyTopUpDto } from './dto/verify-topup.dto';
import { MpesaService } from './services/mpesa.service';
import { BankTransferService } from './services/bank-transfer.service';
import * as crypto from 'crypto';

@Injectable()
export class TopUpService {
  private readonly logger = new Logger(TopUpService.name);
  private readonly MAX_DAILY_TOPUP = 500000; // 500K KES per day
  private readonly MIN_TOPUP_AMOUNT = 50; // 50 KES minimum

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private mpesaService: MpesaService,
    private bankTransferService: BankTransferService,
  ) {}


  async initiateTopUp(userId: string, dto: InitiateTopUpDto) {
    const { method, amount, phoneNumber } = dto;

    this.logger.log(`Initiating top-up: User ${userId}, Method ${method}, Amount ${amount}`);

    // Validate inputs
    await this.validateTopUpRequest(userId, method, amount, phoneNumber);

    // Use database transaction for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get user and wallet with pessimistic locking
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['wallet'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!user || !user.wallet) {
        throw new NotFoundException('User or wallet not found');
      }

      // Check daily limits
      await this.checkDailyLimits(userId, amount);

      // Calculate fees based on payment method
      const fee = this.calculateFee(method, amount);
      const totalAmount = amount + fee;

      // Generate unique transaction ID
      const transactionId = this.generateTransactionId();

      // Create transaction record first
      const transaction = queryRunner.manager.create(Transaction, {
        id: transactionId,
        senderId: userId,
        recipientId: userId,
        amount,
        fee,
        type: 'DEPOSIT',
        status: 'PENDING',
        paymentMethod: method,
        metadata: {
          phoneNumber: phoneNumber || null,
          initiatedAt: new Date().toISOString(),
          userAgent: 'API',
        },
      });

      await queryRunner.manager.save(transaction);

      let paymentDetails: any = {};

      // Process payment method
      switch (method) {
        case 'mpesa':
          paymentDetails = await this.initiateMpesaPayment(phoneNumber, totalAmount, transactionId);
          break;

        case 'bank':
          paymentDetails = await this.initiateBankTransfer(userId, totalAmount, transactionId);
          break;

        default:
          throw new BadRequestException(`Payment method '${method}' not implemented yet`);
      }

      // Update transaction with payment details
      transaction.metadata = {
        ...transaction.metadata,
        paymentDetails,
      };

      await queryRunner.manager.save(transaction);

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(`Top-up initiated successfully: Transaction ${transactionId}`);

      return {
        success: true,
        transaction: {
          id: transaction.id,
          amount,
          fee,
          totalAmount,
          status: transaction.status,
          paymentMethod: method,
          createdAt: transaction.createdAt,
        },
        paymentDetails,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Top-up initiation failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyTopUp(transactionId: string) {
    this.logger.log(`Verifying top-up transaction: ${transactionId}`);

    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['sender', 'sender.wallet'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify with appropriate payment gateway
    let verificationResult: any = {};

    switch (transaction.paymentMethod) {
      case 'mpesa':
        verificationResult = await this.verifyMpesaTransaction(transaction);
        break;

      case 'bank':
        verificationResult = await this.verifyBankTransfer(transaction);
        break;

      default:
        throw new BadRequestException(`Verification not supported for payment method: ${transaction.paymentMethod}`);
    }

    // If transaction is completed, update balance atomically
    if (verificationResult.status === 'COMPLETED' && transaction.status === 'PENDING') {
      await this.completeTopUp(transaction, verificationResult);
    }

    return verificationResult;
  }

  async getTopUpHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: {
        senderId: userId,
        type: 'DEPOSIT',
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: Math.min(limit, 50), // Max 50 per request
    });

    return {
      success: true,
      transactions: transactions.map(t => ({
        id: t.id,
        method: t.paymentMethod,
        amount: t.amount,
        fee: t.fee,
        totalAmount: t.amount + (t.fee || 0),
        status: t.status,
        createdAt: t.createdAt,
        completedAt: t.status === 'COMPLETED' ? t.updatedAt : null,
        reference: t.metadata?.reference || null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async cancelTopUp(transactionId: string, userId: string) {
    this.logger.log(`Cancelling top-up transaction: ${transactionId} for user: ${userId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: {
          id: transactionId,
          senderId: userId,
          status: 'PENDING',
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) {
        throw new NotFoundException('Pending transaction not found or cannot be cancelled');
      }

      // Check if transaction can be cancelled (e.g., not older than 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (transaction.createdAt < thirtyMinutesAgo) {
        throw new BadRequestException('Transaction cannot be cancelled after 30 minutes');
      }

      transaction.status = 'CANCELLED';
      transaction.metadata = {
        ...transaction.metadata,
        cancelledAt: new Date().toISOString(),
        cancelReason: 'User requested cancellation',
      };

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(`Transaction cancelled successfully: ${transactionId}`);

      return {
        success: true,
        message: 'Transaction cancelled successfully',
        transactionId,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to cancel transaction ${transactionId}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Webhook handlers for payment providers
  async handleMpesaWebhook(payload: any, signature?: string) {
    this.logger.log('Processing M-Pesa webhook');

    try {
      // Verify webhook signature if provided
      if (signature && !this.mpesaService.verifyWebhookSignature(JSON.stringify(payload), signature)) {
        this.logger.error('Invalid M-Pesa webhook signature');
        return { success: false, error: 'Invalid signature' };
      }

      // Process M-Pesa callback
      await this.processMpesaCallback(payload);

      return { success: true };
    } catch (error) {
      this.logger.error('M-Pesa webhook processing failed', error);
      return { success: false, error: error.message };
    }
  }

  async handleBankWebhook(payload: any, signature: string) {
    this.logger.log('Processing bank webhook');

    try {
      const success = await this.bankTransferService.processBankWebhook(payload, signature);
      return { success };
    } catch (error) {
      this.logger.error('Bank webhook processing failed', error);
      return { success: false, error: error.message };
    }
  }

  // Private helper methods
  private async validateTopUpRequest(userId: string, method: string, amount: number, phoneNumber?: string): Promise<void> {
    // Validate amount
    if (!amount || amount < this.MIN_TOPUP_AMOUNT) {
      throw new BadRequestException(`Minimum top-up amount is KES ${this.MIN_TOPUP_AMOUNT}`);\n    }\n\n    if (amount > this.MAX_DAILY_TOPUP) {\n      throw new BadRequestException(`Amount exceeds maximum limit of KES ${this.MAX_DAILY_TOPUP.toLocaleString()}`);\n    }\n\n    if (!Number.isInteger(amount)) {\n      throw new BadRequestException('Amount must be a whole number');\n    }\n\n    // Validate payment method\n    const supportedMethods = ['mpesa', 'bank'];\n    if (!supportedMethods.includes(method)) {\n      throw new BadRequestException(`Payment method '${method}' is not supported`);\n    }\n\n    // Method-specific validation\n    if (method === 'mpesa' && !phoneNumber) {\n      throw new BadRequestException('Phone number is required for M-Pesa payments');\n    }\n  }\n\n  private async checkDailyLimits(userId: string, amount: number): Promise<void> {\n    const today = new Date();\n    today.setHours(0, 0, 0, 0);\n\n    const dailyTotal = await this.transactionRepository\n      .createQueryBuilder('transaction')\n      .select('SUM(transaction.amount)', 'total')\n      .where('transaction.senderId = :userId', { userId })\n      .andWhere('transaction.type = :type', { type: 'DEPOSIT' })\n      .andWhere('transaction.status IN (:...statuses)', { statuses: ['PENDING', 'COMPLETED'] })\n      .andWhere('transaction.createdAt >= :today', { today })\n      .getRawOne();\n\n    const currentTotal = parseFloat(dailyTotal.total) || 0;\n\n    if (currentTotal + amount > this.MAX_DAILY_TOPUP) {\n      throw new BadRequestException(\n        `Daily top-up limit exceeded. Current: KES ${currentTotal.toLocaleString()}, Limit: KES ${this.MAX_DAILY_TOPUP.toLocaleString()}`\n      );\n    }\n  }\n\n  private calculateFee(method: string, amount: number): number {\n    switch (method) {\n      case 'mpesa':\n        // M-Pesa fees: 1% with minimum KES 10\n        return Math.max(Math.round(amount * 0.01), 10);\n      case 'bank':\n        // Bank transfer fees: 0.5% with minimum KES 25\n        return Math.max(Math.round(amount * 0.005), 25);\n      default:\n        return Math.round(amount * 0.015); // Default 1.5%\n    }\n  }\n\n  private generateTransactionId(): string {\n    const timestamp = Date.now().toString(36);\n    const random = Math.random().toString(36).substring(2, 8);\n    return `txn_${timestamp}_${random}`.toUpperCase();\n  }\n\n  private async initiateMpesaPayment(phoneNumber: string, amount: number, transactionId: string): Promise<any> {\n    try {\n      const stkResponse = await this.mpesaService.initiateSTKPush(phoneNumber, amount, transactionId);\n      \n      return {\n        type: 'mpesa_stk',\n        checkoutRequestId: stkResponse.CheckoutRequestID,\n        merchantRequestId: stkResponse.MerchantRequestID,\n        message: stkResponse.CustomerMessage,\n        instructions: [\n          'Check your phone for the M-Pesa prompt',\n          'Enter your M-Pesa PIN to complete the payment',\n          'You will receive an SMS confirmation once payment is complete',\n          'Your wallet will be credited automatically',\n        ],\n      };\n    } catch (error) {\n      this.logger.error(`M-Pesa initiation failed: ${error.message}`);\n      throw new InternalServerErrorException('Failed to initiate M-Pesa payment');\n    }\n  }\n\n  private async initiateBankTransfer(userId: string, amount: number, transactionId: string): Promise<any> {\n    try {\n      const transferDetails = await this.bankTransferService.generateBankTransferDetails(\n        amount,\n        userId,\n        transactionId\n      );\n\n      return {\n        type: 'bank_transfer',\n        ...transferDetails,\n      };\n    } catch (error) {\n      this.logger.error(`Bank transfer initiation failed: ${error.message}`);\n      throw new InternalServerErrorException('Failed to generate bank transfer details');\n    }\n  }\n\n  private async verifyMpesaTransaction(transaction: Transaction): Promise<any> {\n    try {\n      const checkoutRequestId = transaction.metadata?.paymentDetails?.checkoutRequestId;\n      \n      if (!checkoutRequestId) {\n        throw new BadRequestException('Invalid M-Pesa transaction data');\n      }\n\n      const queryResult = await this.mpesaService.querySTKPushStatus(checkoutRequestId);\n      \n      return {\n        success: true,\n        transactionId: transaction.id,\n        status: queryResult.ResultCode === '0' ? 'COMPLETED' : 'PENDING',\n        amount: transaction.amount,\n        mpesaResult: queryResult,\n      };\n    } catch (error) {\n      this.logger.error(`M-Pesa verification failed: ${error.message}`);\n      return {\n        success: false,\n        transactionId: transaction.id,\n        status: transaction.status,\n        error: error.message,\n      };\n    }\n  }\n\n  private async verifyBankTransfer(transaction: Transaction): Promise<any> {\n    try {\n      const reference = transaction.metadata?.paymentDetails?.reference;\n      \n      if (!reference) {\n        throw new BadRequestException('Invalid bank transfer reference');\n      }\n\n      const isVerified = await this.bankTransferService.verifyBankTransfer(reference, transaction.amount);\n      \n      return {\n        success: true,\n        transactionId: transaction.id,\n        status: isVerified ? 'COMPLETED' : 'PENDING',\n        amount: transaction.amount,\n        reference,\n      };\n    } catch (error) {\n      this.logger.error(`Bank transfer verification failed: ${error.message}`);\n      return {\n        success: false,\n        transactionId: transaction.id,\n        status: transaction.status,\n        error: error.message,\n      };\n    }\n  }\n\n  private async completeTopUp(transaction: Transaction, verificationResult: any): Promise<void> {\n    const queryRunner = this.dataSource.createQueryRunner();\n    await queryRunner.connect();\n    await queryRunner.startTransaction();\n\n    try {\n      // Get user and wallet with pessimistic locking\n      const user = await queryRunner.manager.findOne(User, {\n        where: { id: transaction.senderId },\n        relations: ['wallet'],\n        lock: { mode: 'pessimistic_write' },\n      });\n\n      if (!user?.wallet) {\n        throw new NotFoundException('User or wallet not found');\n      }\n\n      // Update transaction status\n      transaction.status = 'COMPLETED';\n      transaction.metadata = {\n        ...transaction.metadata,\n        completedAt: new Date().toISOString(),\n        verificationResult,\n      };\n\n      // Update wallet balance\n      user.wallet.balance += transaction.amount;\n      user.wallet.updatedAt = new Date();\n\n      // Save both updates\n      await queryRunner.manager.save(Transaction, transaction);\n      await queryRunner.manager.save(Wallet, user.wallet);\n\n      await queryRunner.commitTransaction();\n\n      this.logger.log(`Top-up completed: ${transaction.id}, Amount: ${transaction.amount}, New Balance: ${user.wallet.balance}`);\n\n    } catch (error) {\n      await queryRunner.rollbackTransaction();\n      this.logger.error(`Failed to complete top-up: ${error.message}`);\n      throw error;\n    } finally {\n      await queryRunner.release();\n    }\n  }\n\n  private async processMpesaCallback(payload: any): Promise<void> {\n    // Process M-Pesa STK callback\n    const checkoutRequestId = payload.Body?.stkCallback?.CheckoutRequestID;\n    const resultCode = payload.Body?.stkCallback?.ResultCode;\n    \n    if (!checkoutRequestId) {\n      this.logger.error('Invalid M-Pesa callback: missing CheckoutRequestID');\n      return;\n    }\n\n    // Find transaction by checkout request ID\n    const transaction = await this.transactionRepository.findOne({\n      where: {\n        status: 'PENDING',\n        paymentMethod: 'mpesa',\n      },\n    });\n\n    if (!transaction) {\n      this.logger.warn(`Transaction not found for M-Pesa callback: ${checkoutRequestId}`);\n      return;\n    }\n\n    if (resultCode === '0') {\n      // Payment successful\n      const verificationResult = {\n        mpesaReceiptNumber: payload.Body?.stkCallback?.CallbackMetadata?.Item?.find(\n          (item: any) => item.Name === 'MpesaReceiptNumber'\n        )?.Value,\n        transactionDate: payload.Body?.stkCallback?.CallbackMetadata?.Item?.find(\n          (item: any) => item.Name === 'TransactionDate'\n        )?.Value,\n      };\n\n      await this.completeTopUp(transaction, verificationResult);\n    } else {\n      // Payment failed\n      transaction.status = 'FAILED';\n      transaction.metadata = {\n        ...transaction.metadata,\n        failedAt: new Date().toISOString(),\n        failureReason: payload.Body?.stkCallback?.ResultDesc || 'Payment failed',\n      };\n\n      await this.transactionRepository.save(transaction);\n      this.logger.log(`M-Pesa payment failed: ${transaction.id}`);\n    }\n  }\n}"