import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { PayrollBatch } from './payroll-batch.entity';
import { Transaction } from './transaction.entity';

export enum PayrollEntryStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

@Entity('payroll_entries')
export class PayrollEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  batchId: string;

  @Column()
  @Index()
  employeeId: string;

  @Column()
  employeeName: string;

  @Column()
  nationalId: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column('decimal', { precision: 15, scale: 2 })
  grossSalary: number;

  @Column('json')
  deductions: Array<{
    type: string;
    amount: number;
    description: string;
  }>;

  @Column('decimal', { precision: 15, scale: 2 })
  totalDeductions: number;

  @Column('decimal', { precision: 15, scale: 2 })
  netSalary: number;

  @Column({
    type: 'enum',
    enum: PayrollEntryStatus,
    default: PayrollEntryStatus.PENDING,
  })
  status: PayrollEntryStatus;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  failureReason: string;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PayrollBatch, (batch) => batch.entries)
  @JoinColumn()
  batch: PayrollBatch;

  @ManyToOne(() => User, (user) => user.payrollEntries)
  @JoinColumn()
  employee: User;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn()
  transaction: Transaction;
}