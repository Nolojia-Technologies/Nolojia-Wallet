import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  escrowBalance: number;

  @Column({ default: 'KES' })
  currency: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFrozen: boolean;

  @Column('decimal', { precision: 15, scale: 2, default: 100000 })
  dailyLimit: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  dailySpent: number;

  @Column({ type: 'date', nullable: true })
  lastTransactionDate: Date;

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn()
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.fromWallet)
  outgoingTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.toWallet)
  incomingTransactions: Transaction[];
}