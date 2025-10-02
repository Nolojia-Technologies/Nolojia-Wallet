import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum OtpPurpose {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  TRANSACTION = 'TRANSACTION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  TWO_FACTOR = 'TWO_FACTOR',
}

@Entity('otps')
@Index(['userId', 'phoneNumber', 'purpose'])
@Index(['expiresAt'])
export class OtpEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  phoneNumber: string;

  @Column()
  otp: string;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
  })
  purpose: OtpPurpose;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ default: 0 })
  attempts: number;

  @Column()
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}