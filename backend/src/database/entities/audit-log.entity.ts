import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  TRANSFER = 'TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  ESCROW_CREATE = 'ESCROW_CREATE',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  PAYROLL_PROCESS = 'PAYROLL_PROCESS',
  FRAUD_REPORT = 'FRAUD_REPORT',
  KYC_VERIFY = 'KYC_VERIFY',
  BLACKLIST_ADD = 'BLACKLIST_ADD',
  BLACKLIST_REMOVE = 'BLACKLIST_REMOVE',
  COMPANY_REGISTER = 'COMPANY_REGISTER',
  EMPLOYEE_ADD = 'EMPLOYEE_ADD',
  EMPLOYEE_REMOVE = 'EMPLOYEE_REMOVE',
  VENDOR_PAYMENT = 'VENDOR_PAYMENT',
  TAX_REPORT_GENERATE = 'TAX_REPORT_GENERATE',
}

export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PENDING = 'PENDING',
}

export enum EntityType {
  USER = 'USER',
  WALLET = 'WALLET',
  TRANSACTION = 'TRANSACTION',
  ESCROW = 'ESCROW',
  COMPANY = 'COMPANY',
  EMPLOYEE = 'EMPLOYEE',
  PAYROLL = 'PAYROLL',
  FRAUD_REPORT = 'FRAUD_REPORT',
  RECEIPT = 'RECEIPT',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  @Index()
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: EntityType,
  })
  @Index()
  entityType: EntityType;

  @Column({ nullable: true })
  @Index()
  entityId: string;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.SUCCESS,
  })
  status: AuditStatus;

  @Column({ nullable: true })
  description: string;

  @Column('json', { nullable: true })
  oldValues: any;

  @Column('json', { nullable: true })
  newValues: any;

  @Column('json', { nullable: true })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
    amount?: number;
    recipientId?: string;
    companyId?: string;
    employeeId?: string;
    [key: string]: any;
  };

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  riskScore: number;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid', { nullable: true })
  @Index()
  userId: string;
}