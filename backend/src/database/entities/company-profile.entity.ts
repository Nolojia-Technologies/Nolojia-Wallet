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
import { CompanyEmployee } from './company-employee.entity';

export enum CompanySize {
  MICRO = 'MICRO', // 1-9 employees
  SMALL = 'SMALL', // 10-49 employees
  MEDIUM = 'MEDIUM', // 50-249 employees
  LARGE = 'LARGE', // 250+ employees
}

export enum IndustryType {
  TECHNOLOGY = 'TECHNOLOGY',
  MANUFACTURING = 'MANUFACTURING',
  RETAIL = 'RETAIL',
  CONSTRUCTION = 'CONSTRUCTION',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  FINANCE = 'FINANCE',
  AGRICULTURE = 'AGRICULTURE',
  TRANSPORTATION = 'TRANSPORTATION',
  OTHER = 'OTHER',
}

@Entity('company_profiles')
export class CompanyProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyName: string;

  @Column({ unique: true })
  @Index()
  registrationNumber: string;

  @Column()
  kraPin: string;

  @Column({ nullable: true })
  vatNumber: string;

  @Column({
    type: 'enum',
    enum: CompanySize,
    default: CompanySize.MICRO,
  })
  companySize: CompanySize;

  @Column({
    type: 'enum',
    enum: IndustryType,
    default: IndustryType.OTHER,
  })
  industry: IndustryType;

  @Column({ nullable: true })
  physicalAddress: string;

  @Column({ nullable: true })
  postalAddress: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isKRAVerified: boolean;

  @Column({ default: false })
  isRegistrarVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column('json', { nullable: true })
  bankingDetails: {
    bankName?: string;
    accountNumber?: string;
    branchCode?: string;
  };

  @Column('json', { nullable: true })
  complianceInfo: {
    lastAuditDate?: Date;
    nextFilingDate?: Date;
    payeTaxRate?: number;
    vatRate?: number;
  };

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User)
  @JoinColumn()
  owner: User;

  @Column('uuid')
  ownerId: string;

  @OneToMany(() => CompanyEmployee, (employee) => employee.company)
  employees: CompanyEmployee[];
}