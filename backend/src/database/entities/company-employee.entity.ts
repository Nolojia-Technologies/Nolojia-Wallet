import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { CompanyProfile } from './company-profile.entity';
import { User } from './user.entity';

export enum EmployeeRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  FINANCE = 'FINANCE',
  AUDITOR = 'AUDITOR',
  EMPLOYEE = 'EMPLOYEE',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export enum PayrollFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

@Entity('company_employees')
@Unique(['companyId', 'employeeId'])
@Unique(['companyId', 'employeeNumber'])
export class CompanyEmployee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeNumber: string;

  @Column({
    type: 'enum',
    enum: EmployeeRole,
    default: EmployeeRole.EMPLOYEE,
  })
  role: EmployeeRole;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  @Column()
  position: string;

  @Column()
  department: string;

  @Column('decimal', { precision: 10, scale: 2 })
  grossSalary: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  allowances: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  deductions: number;

  @Column({
    type: 'enum',
    enum: PayrollFrequency,
    default: PayrollFrequency.MONTHLY,
  })
  payrollFrequency: PayrollFrequency;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankBranch: string;

  @Column({ nullable: true })
  nhifNumber: string;

  @Column({ nullable: true })
  nssfNumber: string;

  @Column({ nullable: true })
  kraPin: string;

  @Column({ type: 'date', nullable: true })
  hireDate: Date;

  @Column({ type: 'date', nullable: true })
  terminationDate: Date;

  @Column('json', { nullable: true })
  permissions: {
    canViewPayroll?: boolean;
    canProcessPayroll?: boolean;
    canManageEmployees?: boolean;
    canViewReports?: boolean;
    canManageVendors?: boolean;
    canApproveTransactions?: boolean;
  };

  @Column('json', { nullable: true })
  taxInfo: {
    taxRate?: number;
    exemptions?: number;
    reliefs?: number;
  };

  @Column('json', { nullable: true })
  emergencyContact: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CompanyProfile, (company) => company.employees)
  @JoinColumn({ name: 'companyId' })
  company: CompanyProfile;

  @Column('uuid')
  @Index()
  companyId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'employeeId' })
  employee: User;

  @Column('uuid', { nullable: true })
  @Index()
  employeeId: string; // This can be null for employees who haven't created their own account yet
}