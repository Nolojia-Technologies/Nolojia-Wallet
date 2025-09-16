import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Wallet } from './wallet.entity';
import { Transaction } from './transaction.entity';
import { FraudReport } from './fraud-report.entity';
import { PayrollEntry } from './payroll-entry.entity';
import { CompanyProfile } from './company-profile.entity';
import { CompanyEmployee } from './company-employee.entity';

export enum AccountType {
  PERSONAL = 'PERSONAL',
  COMPANY = 'COMPANY',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  EMPLOYER = 'EMPLOYER',
  POLICE = 'POLICE',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  COMPANY_HR = 'COMPANY_HR',
  COMPANY_FINANCE = 'COMPANY_FINANCE',
  COMPANY_AUDITOR = 'COMPANY_AUDITOR',
}

export enum TrustStatus {
  CLEAN = 'CLEAN',
  FLAGGED = 'FLAGGED',
  BLACKLISTED = 'BLACKLISTED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ unique: true })
  @Index()
  phone: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true, nullable: true })
  @Index()
  nationalId: string;

  @Column({ unique: true, nullable: true })
  @Index()
  companyRegistrationNumber: string;

  @Column({ nullable: true })
  kraPin: string;

  @Column({ unique: true, length: 8 })
  @Index()
  userCode: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: AccountType,
    default: AccountType.PERSONAL,
  })
  accountType: AccountType;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column('decimal', { precision: 3, scale: 2, default: 5.0 })
  trustScore: number;

  @Column({
    type: 'enum',
    enum: TrustStatus,
    default: TrustStatus.CLEAN,
  })
  trustStatus: TrustStatus;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isBlacklisted: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLogin: Date;

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => FraudReport, (report) => report.reporter)
  reportsSubmitted: FraudReport[];

  @OneToMany(() => FraudReport, (report) => report.reportedUser)
  reportsReceived: FraudReport[];

  @OneToMany(() => PayrollEntry, (entry) => entry.employee)
  payrollEntries: PayrollEntry[];

  @OneToOne(() => CompanyProfile, (profile) => profile.owner)
  companyProfile: CompanyProfile;

  @OneToMany(() => CompanyEmployee, (employee) => employee.employee)
  employeeProfiles: CompanyEmployee[];
}