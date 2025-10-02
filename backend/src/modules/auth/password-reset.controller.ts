import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { VerificationService } from './verification.service';
import { AuthService } from './auth.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { EmailService } from '../email/email.service';
import { AuditLogService, AuditAction, AuditSeverity } from '../../common/services/audit-log.service';

class ResetPasswordDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

@ApiTags('Password Reset')
@Controller('api/auth')
@UseGuards(RateLimitGuard)
export class PasswordResetController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly emailService: EmailService,
    private readonly auditLogService: AuditLogService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or password requirements not met' })
  async resetPassword(@Body() body: ResetPasswordDto, @Req() req: Request) {
    const { token, newPassword, confirmPassword } = body;

    // Validation
    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    if (!newPassword || !confirmPassword) {
      throw new BadRequestException('New password and confirmation are required');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Password strength validation
    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(newPassword)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\\d)/.test(newPassword)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    if (!/(?=.*[!@#$%^&*(),.?\":{}|<>])/.test(newPassword)) {
      throw new BadRequestException('Password must contain at least one special character');
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      // Validate token
      const tokenValidation = await this.verificationService.validatePasswordResetToken(token);

      if (!tokenValidation.valid || !tokenValidation.user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const user = tokenValidation.user;

      // Hash new password
      const saltRounds = 14;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password and related fields
      await this.userRepository.update(
        { id: user.id },
        {
          password: hashedPassword,
          lastPasswordReset: new Date(),
          loginAttempts: 0, // Reset login attempts
          lockedUntil: null, // Unlock account if it was locked
        }
      );

      // Mark reset token as used
      await this.verificationService.markPasswordResetAsUsed(token);

      // Send password changed confirmation email
      await this.emailService.sendPasswordChangedEmail(user.email, user.firstName);

      // Log password reset
      await this.auditLogService.log(
        AuditAction.PASSWORD_RESET,
        AuditSeverity.MEDIUM,
        `Password reset completed for user: ${user.email}`,
        {
          userId: user.id,
          ipAddress,
          userAgent,
          metadata: {
            email: user.email,
            resetMethod: 'email_token',
          },
        },
      );

      console.log(`Password reset successfully for user: ${user.email}`);

      return {
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
      };
    } catch (error) {
      console.error('Password reset failed:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Password reset failed. Please try again.');
    }
  }

  @Post('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate password reset token' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validateResetToken(@Body() body: { token: string }) {
    const { token } = body;

    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    try {
      const validation = await this.verificationService.validatePasswordResetToken(token);

      return {
        success: true,
        valid: validation.valid,
        message: validation.valid ? 'Token is valid' : 'Token is invalid or expired',
        user: validation.valid ? {
          email: validation.user?.email,
          firstName: validation.user?.firstName,
        } : null,
      };
    } catch (error) {
      return {
        success: true,
        valid: false,
        message: 'Token is invalid or expired',
      };
    }
  }
}