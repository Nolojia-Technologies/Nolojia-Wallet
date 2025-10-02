import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { User, TrustStatus, AccountType, UserRole } from '../../database/entities/user.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { CompanyProfile } from '../../database/entities/company-profile.entity';
import { EmailVerification, VerificationType } from '../../database/entities/email-verification.entity';
import { VerificationService } from './verification.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyKycDto } from './dto/verify-kyc.dto';
import { generateUserCode } from '../../common/utils/user-code.util';
import { EmailService } from '../../common/services/email.service';
import { OtpService } from '../sms/otp.service';
import { OtpPurpose } from '../sms/entities/otp.entity';
import { EmailService } from '../email/email.service';
import { AuditLogService, AuditAction, AuditSeverity } from '../../common/services/audit-log.service';

export interface SessionData {
  userId: string;
  email: string;
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly sessionStore = new Map<string, SessionData>();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly REFRESH_TOKEN_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(CompanyProfile)
    private readonly companyProfileRepository: Repository<CompanyProfile>,
    @InjectRepository(EmailVerification)
    private readonly verificationRepository: Repository<EmailVerification>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly verificationService: VerificationService,
    private readonly auditLogService: AuditLogService,
  ) {
    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  async register(registerDto: RegisterDto, ipAddress: string, userAgent: string) {
    this.logger.log(`Registration attempt: ${registerDto.email}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check for existing users
      const existingUserConditions: any[] = [
        { email: registerDto.email },
        { phoneNumber: registerDto.phone },
      ];

      if (registerDto.accountType === AccountType.PERSONAL && registerDto.nationalId) {
        existingUserConditions.push({ nationalId: registerDto.nationalId });
      }
      if (registerDto.accountType === AccountType.COMPANY && registerDto.companyRegistrationNumber) {
        existingUserConditions.push({ companyRegistrationNumber: registerDto.companyRegistrationNumber });
      }

      const existingUser = await queryRunner.manager.findOne(User, {
        where: existingUserConditions,
      });

      if (existingUser) {
        await this.auditLogService.logSuspiciousActivity(
          `Registration attempt with existing credentials: ${registerDto.email}`,
          undefined,
          ipAddress,
          { email: registerDto.email, reason: 'duplicate_registration' },
        );

        if (existingUser.email === registerDto.email) {
          throw new ConflictException('Email already registered');
        }
        if (existingUser.phoneNumber === registerDto.phone) {
          throw new ConflictException('Phone number already registered');
        }
        if (registerDto.accountType === AccountType.PERSONAL && existingUser.nationalId === registerDto.nationalId) {
          throw new ConflictException('National ID already registered');
        }
        if (registerDto.accountType === AccountType.COMPANY && existingUser.companyRegistrationNumber === registerDto.companyRegistrationNumber) {
          throw new ConflictException('Company registration number already registered');
        }
      }

      // Hash password with high salt rounds
      const saltRounds = 14;
      const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

      // Generate unique user code
      let userCode: string;
      do {
        userCode = generateUserCode();
      } while (await queryRunner.manager.findOne(User, { where: { userCode } }));

      // Set default role based on account type
      const defaultRole = registerDto.accountType === AccountType.COMPANY
        ? UserRole.COMPANY_ADMIN
        : UserRole.USER;

      // Create user
      const user = queryRunner.manager.create(User, {
        ...registerDto,
        password: hashedPassword,
        userCode,
        role: defaultRole,
        trustScore: 5.0,
        trustStatus: TrustStatus.CLEAN,
        isEmailVerified: false, // Require email verification
        emailVerifiedAt: null,
        isPhoneVerified: false,
        phoneVerifiedAt: null,
        isKycVerified: false,
        kycVerifiedAt: null,
        loginAttempts: 0,
        lockedUntil: null,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Create company profile for company accounts
      if (registerDto.accountType === AccountType.COMPANY && registerDto.companyName) {
        const companyProfile = queryRunner.manager.create(CompanyProfile, {
          companyName: registerDto.companyName,
          registrationNumber: registerDto.companyRegistrationNumber,
          kraPin: registerDto.kraPin,
          ownerId: savedUser.id,
        });
        await queryRunner.manager.save(companyProfile);
      }

      // Create wallet for user
      const wallet = queryRunner.manager.create(Wallet, {
        userId: savedUser.id,
        balance: 0,
        escrowBalance: 0,
        currency: 'KES',
      });

      await queryRunner.manager.save(wallet);

      // Generate email verification
      const verificationResult = await this.verificationService.createEmailVerification({
        userId: savedUser.id,
        email: savedUser.email,
        type: VerificationType.EMAIL_VERIFICATION,
        ipAddress,
        userAgent,
      });

      await queryRunner.commitTransaction();

      // Log successful registration
      await this.auditLogService.log(
        AuditAction.USER_CREATED,
        AuditSeverity.LOW,
        `New user registered: ${registerDto.email}`,
        {
          userId: savedUser.id,
          ipAddress,
          userAgent,
          metadata: {
            accountType: registerDto.accountType,
            userCode: savedUser.userCode,
          },
        },
      );

      this.logger.log(`User registered successfully: ${registerDto.email}`);

      // Remove password from response
      const { password, ...userResponse } = savedUser;

      return {
        success: true,
        data: {
          user: userResponse,
          emailVerificationRequired: true,
          verificationSent: verificationResult.success,
          expiresAt: verificationResult.expiresAt,
          message: 'Registration successful. Please check your email to verify your account.',
          otpExpiresIn: otpResult.expiresIn,
        },
        message: 'Registration successful. Please verify your email address.',
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Registration failed for ${registerDto.email}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyEmail(token: string, ipAddress: string, userAgent: string): Promise<any> {
    try {
      const verificationResult = await this.verificationService.verifyToken({
        token,
        ipAddress,
        userAgent,
      });

      if (!verificationResult.success) {
        throw new BadRequestException(verificationResult.message);
      }

      // Log email verification
      await this.auditLogService.log(
        AuditAction.LOGIN,
        AuditSeverity.LOW,
        'Email verified successfully',
        {
          userId: verificationResult.user.id,
          ipAddress,
          userAgent,
          metadata: { email: verificationResult.user.email },
        },
      );

      this.logger.log(`Email verified successfully: ${verificationResult.user.email}`);

      return {
        success: true,
        message: 'Email verified successfully. You can now log in.',
        user: verificationResult.user,
      };

    } catch (error) {
      this.logger.error('Email verification failed:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    this.logger.log(`Login attempt: ${loginDto.email} from ${ipAddress}`);

    try {
      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email },
        relations: ['wallet'],
      });

      if (!user) {
        await this.auditLogService.logLogin(
          loginDto.email,
          ipAddress,
          userAgent,
          false,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if account is locked
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        await this.auditLogService.logSuspiciousActivity(
          `Login attempt on locked account: ${user.email}`,
          user.id,
          ipAddress,
          { remainingLockTime: remainingTime },
        );
        throw new UnauthorizedException(`Account locked. Try again in ${remainingTime} minutes.`);
      }

      // Check if account is active
      if (!user.isActive) {
        await this.auditLogService.logLogin(user.id, ipAddress, userAgent, false);
        throw new UnauthorizedException('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        // Increment login attempts
        user.loginAttempts = (user.loginAttempts || 0) + 1;

        // Lock account if max attempts reached
        if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          user.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
          await this.auditLogService.logSuspiciousActivity(
            `Account locked due to multiple failed login attempts: ${user.email}`,
            user.id,
            ipAddress,
            { attempts: user.loginAttempts },
          );
        }

        await this.userRepository.save(user);
        await this.auditLogService.logLogin(user.id, ipAddress, userAgent, false);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Reset login attempts on successful password verification
      user.loginAttempts = 0;
      user.lockedUntil = null;
      user.lastLogin = new Date();

      // Check if email is verified
      if (!user.isEmailVerified) {
        await this.userRepository.save(user);

        return {
          success: false,
          requiresEmailVerification: true,
          message: 'Please verify your email address to continue. Check your email for the verification link.',
          email: user.email,
        };
      }

      // Generate session
      const sessionId = crypto.randomUUID();
      const refreshToken = this.generateRefreshToken();

      // Create session data
      const sessionData: SessionData = {
        userId: user.id,
        email: user.email,
        sessionId,
        createdAt: new Date(),
        lastActivity: new Date(),
        ipAddress,
        userAgent,
        refreshToken,
      };

      this.sessionStore.set(sessionId, sessionData);

      // Generate JWT token
      const accessToken = this.generateAccessToken(user, sessionId);

      await this.userRepository.save(user);

      // Log successful login
      await this.auditLogService.logLogin(user.id, ipAddress, userAgent, true);

      this.logger.log(`User logged in successfully: ${user.email}`);

      // Remove password from response
      const { password, ...userResponse } = user;

      return {
        success: true,
        data: {
          user: userResponse,
          accessToken,
          refreshToken,
          sessionId,
          expiresIn: this.SESSION_TIMEOUT / 1000, // in seconds
        },
        message: 'Login successful',
      };

    } catch (error) {
      this.logger.error(`Login failed for ${loginDto.email}:`, error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string, ipAddress: string): Promise<any> {
    try {
      // Find session by refresh token
      const sessionData = Array.from(this.sessionStore.values()).find(
        session => session.refreshToken === refreshToken
      );

      if (!sessionData) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if session is expired
      const sessionAge = Date.now() - sessionData.createdAt.getTime();
      if (sessionAge > this.REFRESH_TOKEN_TIMEOUT) {
        this.sessionStore.delete(sessionData.sessionId);
        throw new UnauthorizedException('Refresh token expired');
      }

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: sessionData.userId },
        relations: ['wallet'],
      });

      if (!user || !user.isActive) {
        this.sessionStore.delete(sessionData.sessionId);
        throw new UnauthorizedException('Invalid user');
      }

      // Update session activity
      sessionData.lastActivity = new Date();
      sessionData.ipAddress = ipAddress;

      // Generate new access token
      const accessToken = this.generateAccessToken(user, sessionData.sessionId);

      this.logger.log(`Token refreshed for user: ${user.email}`);

      return {
        success: true,
        data: {
          accessToken,
          expiresIn: this.SESSION_TIMEOUT / 1000,
        },
        message: 'Token refreshed successfully',
      };

    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  async logout(sessionId: string, userId: string): Promise<any> {
    try {
      // Remove session
      this.sessionStore.delete(sessionId);

      // Invalidate user OTPs
      await this.otpService.invalidateUserOTPs(userId);

      // Log logout
      await this.auditLogService.log(
        AuditAction.LOGOUT,
        AuditSeverity.LOW,
        'User logged out',
        { userId },
      );

      this.logger.log(`User logged out: ${userId}`);

      return {
        success: true,
        message: 'Logout successful',
      };

    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw error;
    }
  }

  async forgotPassword(email: string, ipAddress: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        // Don't reveal if email exists
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent.',
        };
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      user.passwordResetToken = resetToken;
      user.passwordResetExpiry = resetTokenExpiry;
      await this.userRepository.save(user);

      // Send password reset email
      await this.emailService.sendPasswordResetEmail(
        email,
        user.firstName,
        resetToken,
      );

      // Log password reset request
      await this.auditLogService.log(
        AuditAction.PASSWORD_CHANGED,
        AuditSeverity.MEDIUM,
        'Password reset requested',
        {
          userId: user.id,
          ipAddress,
          metadata: { email },
        },
      );

      this.logger.log(`Password reset requested for: ${email}`);

      return {
        success: true,
        message: 'Password reset link sent to your email',
      };

    } catch (error) {
      this.logger.error('Password reset request failed:', error);
      throw new BadRequestException('Failed to process password reset request');
    }
  }

  async resetPassword(token: string, newPassword: string, ipAddress: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          passwordResetToken: token,
        },
      });

      if (!user || !user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Hash new password
      const saltRounds = 14;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password and clear reset token
      user.password = hashedPassword;
      user.passwordResetToken = null;
      user.passwordResetExpiry = null;
      user.passwordChangedAt = new Date();

      // Reset login attempts
      user.loginAttempts = 0;
      user.lockedUntil = null;

      await this.userRepository.save(user);

      // Invalidate all sessions for this user
      this.invalidateUserSessions(user.id);

      // Log password reset
      await this.auditLogService.log(
        AuditAction.PASSWORD_CHANGED,
        AuditSeverity.MEDIUM,
        'Password reset completed',
        {
          userId: user.id,
          ipAddress,
        },
      );

      this.logger.log(`Password reset completed for user: ${user.id}`);

      return {
        success: true,
        message: 'Password reset successful',
      };

    } catch (error) {
      this.logger.error('Password reset failed:', error);
      throw error;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress: string,
  ): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        await this.auditLogService.logSuspiciousActivity(
          'Invalid current password during password change',
          userId,
          ipAddress,
        );
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 14;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      await this.userRepository.save(user);

      // Log password change
      await this.auditLogService.log(
        AuditAction.PASSWORD_CHANGED,
        AuditSeverity.MEDIUM,
        'Password changed by user',
        {
          userId,
          ipAddress,
        },
      );

      this.logger.log(`Password changed for user: ${userId}`);

      return {
        success: true,
        message: 'Password changed successfully',
      };

    } catch (error) {
      this.logger.error('Password change failed:', error);
      throw error;
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallet'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove password from response
    const { password, passwordResetToken, passwordResetExpiry, ...userResponse } = user;

    return {
      success: true,
      data: userResponse,
      message: 'Profile retrieved successfully',
    };
  }

  async validateSession(sessionId: string): Promise<SessionData | null> {
    const sessionData = this.sessionStore.get(sessionId);

    if (!sessionData) {
      return null;
    }

    // Check if session is expired
    const sessionAge = Date.now() - sessionData.lastActivity.getTime();
    if (sessionAge > this.SESSION_TIMEOUT) {
      this.sessionStore.delete(sessionId);
      return null;
    }

    // Update last activity
    sessionData.lastActivity = new Date();
    this.sessionStore.set(sessionId, sessionData);

    return sessionData;
  }

  private generateAccessToken(user: User, sessionId: string): string {
    const payload = {
      sub: user.id,
      email: user.email,
      accountType: user.accountType,
      role: user.role,
      userCode: user.userCode,
      sessionId,
      isEmailVerified: user.isEmailVerified,
      isKycVerified: user.isKycVerified,
      iat: Math.floor(Date.now() / 1000),
    };

    return this.jwtService.sign(payload, {
      expiresIn: '15m', // Short-lived access token
    });
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private invalidateUserSessions(userId: string): void {
    const sessionsToDelete: string[] = [];

    for (const [sessionId, sessionData] of this.sessionStore.entries()) {
      if (sessionData.userId === userId) {
        sessionsToDelete.push(sessionId);
      }
    }

    sessionsToDelete.forEach(sessionId => {
      this.sessionStore.delete(sessionId);
    });

    this.logger.log(`Invalidated ${sessionsToDelete.length} sessions for user: ${userId}`);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, sessionData] of this.sessionStore.entries()) {
      const sessionAge = now - sessionData.lastActivity.getTime();
      if (sessionAge > this.SESSION_TIMEOUT) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.sessionStore.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      this.logger.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  // Get session statistics for monitoring
  getSessionStatistics(): {
    totalSessions: number;
    sessionsByUser: Record<string, number>;
    averageSessionAge: number;
  } {
    const now = Date.now();
    const sessionsByUser: Record<string, number> = {};
    let totalSessionAge = 0;

    for (const sessionData of this.sessionStore.values()) {
      sessionsByUser[sessionData.userId] = (sessionsByUser[sessionData.userId] || 0) + 1;
      totalSessionAge += now - sessionData.lastActivity.getTime();
    }

    return {
      totalSessions: this.sessionStore.size,
      sessionsByUser,
      averageSessionAge: this.sessionStore.size > 0 ? totalSessionAge / this.sessionStore.size : 0,
    };
  }
}