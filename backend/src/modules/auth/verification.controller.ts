import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { VerificationService } from './verification.service';
import { AuthService } from './auth.service';
import { VerificationType } from '../../database/entities/email-verification.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

class VerifyEmailDto {
  token: string;
}

class ResendVerificationDto {
  email: string;
  type?: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
}

@ApiTags('Email Verification')
@Controller('api/auth')
@UseGuards(RateLimitGuard)
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly authService: AuthService,
  ) {}

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() body: VerifyEmailDto, @Req() req: Request) {
    const { token } = body;

    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.authService.verifyEmail(token, ipAddress, userAgent);

    return {
      success: result.success,
      message: result.message,
      data: result.user ? {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        isEmailVerified: result.user.isEmailVerified,
      } : null,
    };
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address via GET with token query parameter' })
  @ApiQuery({ name: 'token', description: 'Email verification token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmailGet(@Query('token') token: string, @Req() req: Request) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.authService.verifyEmail(token, ipAddress, userAgent);

    return {
      success: result.success,
      message: result.message,
      data: result.user ? {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        isEmailVerified: result.user.isEmailVerified,
      } : null,
    };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendVerification(@Body() body: ResendVerificationDto, @Req() req: Request) {
    const { email, type = 'EMAIL_VERIFICATION' } = body;

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.verificationService.resendVerification(
      email,
      type as VerificationType,
      ipAddress,
      userAgent,
    );

    return {
      success: result.success,
      message: result.message,
      expiresAt: result.expiresAt,
    };
  }

  @Get('verification-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user verification status' })
  @ApiResponse({ status: 200, description: 'Verification status retrieved successfully' })
  async getVerificationStatus(@Req() req: any) {
    const userId = req.user.id;

    const status = await this.verificationService.getVerificationStatus(userId);

    return {
      success: true,
      data: status,
    };
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if user exists' })
  async requestPasswordReset(@Body() body: { email: string }, @Req() req: Request) {
    const { email } = body;

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      const result = await this.verificationService.resendVerification(
        email,
        VerificationType.PASSWORD_RESET,
        ipAddress,
        userAgent,
      );

      // Always return success message for security (don't reveal if email exists)
      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
    } catch (error) {
      // Always return success message for security
      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
    }
  }

  @Get('check-token')
  @ApiOperation({ summary: 'Check if a verification token is valid' })
  @ApiQuery({ name: 'token', description: 'Verification token to check' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async checkToken(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    try {
      // This will validate the token without using it
      const verification = await this.verificationService.validatePasswordResetToken(token);

      return {
        success: true,
        valid: verification.valid,
        message: verification.valid ? 'Token is valid' : 'Token is invalid or expired',
      };
    } catch (error) {
      return {
        success: true,
        valid: false,
        message: 'Token is invalid or expired',
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check verification service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async healthCheck() {
    return {
      success: true,
      message: 'Verification service is running',
      timestamp: new Date().toISOString(),
      services: {
        verification: 'active',
        email: 'active',
      },
    };
  }
}