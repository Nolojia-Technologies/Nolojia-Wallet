import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum VerificationType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
}

@Entity('email_verifications')
@Index(['token'])
@Index(['email', 'type'])
@Index(['userId', 'type'])
@Index(['expiresAt'])
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  email: string;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: VerificationType,
  })
  type: VerificationType;

  @Column({ default: false })
  isUsed: boolean;

  @Column()
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}