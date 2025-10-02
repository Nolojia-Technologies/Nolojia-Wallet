import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { VerificationController } from './verification.controller';
import { PasswordResetController } from './password-reset.controller';
import { VerificationService } from './verification.service';
import { User } from '../../database/entities/user.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { CompanyProfile } from '../../database/entities/company-profile.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { EmailVerification } from '../../database/entities/email-verification.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { jwtConfig } from '../../config/jwt.config';
import { EmailService } from '../../common/services/email.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { SmsModule } from '../sms/sms.module';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet, CompanyProfile, AuditLog, EmailVerification]),
    PassportModule,
    JwtModule.registerAsync(jwtConfig),
    ConfigModule,
    SmsModule,
  ],
  controllers: [AuthController, VerificationController, PasswordResetController],
  providers: [
    AuthService,
    VerificationService,
    JwtStrategy,
    LocalStrategy,
    EmailService,
    AuditLogService,
    RateLimitGuard,
  ],
  exports: [AuthService, EmailService, AuditLogService],
})
export class AuthModule {}