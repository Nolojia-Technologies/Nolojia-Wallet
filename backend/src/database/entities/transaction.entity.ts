import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Wallet } from './wallet.entity';
import { EscrowTransaction } from './escrow-transaction.entity';
import { DigitalReceipt } from './digital-receipt.entity';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  ESCROW_CREATE = 'ESCROW_CREATE',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  PAYROLL = 'PAYROLL',
  FEE = 'FEE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  MPESA = 'MPESA',
  AIRTEL = 'AIRTEL',
  BANK = 'BANK',
  WALLET = 'WALLET',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  reference: string;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column({ nullable: true })
  @Index()
  fromWalletId: string;

  @Column({ nullable: true })
  @Index()
  toWalletId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  fee: number;

  @Column({ default: 'KES' })
  currency: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  externalReference: string;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.transactions, { nullable: true })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Wallet, (wallet) => wallet.outgoingTransactions, { nullable: true })
  @JoinColumn()
  fromWallet: Wallet;

  @ManyToOne(() => Wallet, (wallet) => wallet.incomingTransactions, { nullable: true })
  @JoinColumn()
  toWallet: Wallet;

  @OneToOne(() => EscrowTransaction, (escrow) => escrow.transaction, { nullable: true })
  escrowTransaction: EscrowTransaction;

  @OneToOne(() => DigitalReceipt, (receipt) => receipt.transaction, { nullable: true })
  digitalReceipt: DigitalReceipt;
}