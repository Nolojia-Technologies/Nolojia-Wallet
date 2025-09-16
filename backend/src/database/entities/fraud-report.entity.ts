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

export enum FraudReportStatus {
  SUBMITTED = 'SUBMITTED',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum FraudType {
  FAKE_GOODS = 'FAKE_GOODS',
  NON_DELIVERY = 'NON_DELIVERY',
  IDENTITY_THEFT = 'IDENTITY_THEFT',
  PAYMENT_FRAUD = 'PAYMENT_FRAUD',
  PHISHING = 'PHISHING',
  OTHER = 'OTHER',
}

@Entity('fraud_reports')
export class FraudReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  reporterId: string;

  @Column()
  @Index()
  reportedUserId: string;

  @Column({
    type: 'enum',
    enum: FraudType,
  })
  fraudType: FraudType;

  @Column('text')
  reason: string;

  @Column('json', { nullable: true })
  evidence: string[];

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  amountInvolved: number;

  @Column({
    type: 'enum',
    enum: FraudReportStatus,
    default: FraudReportStatus.SUBMITTED,
  })
  status: FraudReportStatus;

  @Column({ nullable: true })
  investigatorId: string;

  @Column('text', { nullable: true })
  investigationNotes: string;

  @Column('text', { nullable: true })
  resolution: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.reportsSubmitted)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @ManyToOne(() => User, (user) => user.reportsReceived)
  @JoinColumn({ name: 'reportedUserId' })
  reportedUser: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'investigatorId' })
  investigator: User;
}