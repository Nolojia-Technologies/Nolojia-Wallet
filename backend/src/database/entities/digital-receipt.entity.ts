import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

@Entity('digital_receipts')
export class DigitalReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  receiptNumber: string;

  @Column()
  @Index()
  transactionId: string;

  @Column()
  @Index()
  sellerId: string;

  @Column()
  @Index()
  buyerId: string;

  @Column('json')
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    serialNumber?: string;
    imeiNumber?: string;
    images?: string[];
  }>;

  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ default: 'KES' })
  currency: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  taxRate: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  taxAmount: number;

  @Column('text')
  qrCode: string;

  @Column('text')
  digitalSignature: string;

  @Column({ default: true })
  isVerified: boolean;

  @Column({ default: false })
  isFlagged: boolean;

  @Column({ nullable: true })
  flagReason: string;

  @Column({ nullable: true })
  verificationUrl: string;

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => Transaction, (transaction) => transaction.digitalReceipt)
  @JoinColumn()
  transaction: Transaction;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyerId' })
  buyer: User;
}