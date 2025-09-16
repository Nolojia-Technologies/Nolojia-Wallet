import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { PayrollEntry } from './payroll-entry.entity';

export enum PayrollStatus {
  UPLOADED = 'UPLOADED',
  VALIDATING = 'VALIDATING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('payroll_batches')
export class PayrollBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  companyId: string;

  @Column()
  batchName: string;

  @Column()
  totalEmployees: number;

  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ default: 0 })
  processedEmployees: number;

  @Column({ default: 0 })
  failedEmployees: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  processedAmount: number;

  @Column({
    type: 'enum',
    enum: PayrollStatus,
    default: PayrollStatus.UPLOADED,
  })
  status: PayrollStatus;

  @Column({ nullable: true })
  uploadedFile: string;

  @Column({ nullable: true })
  failureReason: string;

  @Column('json', { nullable: true })
  validationErrors: any[];

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'companyId' })
  company: User;

  @OneToMany(() => PayrollEntry, (entry) => entry.batch)
  entries: PayrollEntry[];
}