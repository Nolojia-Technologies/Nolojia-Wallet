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

export enum EscrowStatus {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  CONFIRMED = 'CONFIRMED',
  RELEASED = 'RELEASED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

@Entity('escrow_transactions')
export class EscrowTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  buyerId: string;

  @Column()
  @Index()
  sellerId: string;

  @Column()
  @Index()
  transactionId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ default: 'KES' })
  currency: string;

  @Column()
  itemDescription: string;

  @Column('json', { nullable: true })
  itemImages: string[];

  @Column({ nullable: true })
  itemSerialNumber: string;

  @Column({ nullable: true })
  itemImeiNumber: string;

  @Column({
    type: 'enum',
    enum: EscrowStatus,
    default: EscrowStatus.CREATED,
  })
  status: EscrowStatus;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  deliveryAddress: string;

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  releasedAt: Date;

  @Column({ nullable: true })
  disputeReason: string;

  @Column('json', { nullable: true })
  disputeEvidence: string[];

  @Column({ nullable: true })
  adminNotes: string;

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @OneToOne(() => Transaction, (transaction) => transaction.escrowTransaction)
  @JoinColumn()
  transaction: Transaction;
}