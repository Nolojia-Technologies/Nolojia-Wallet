import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Ip,
  Headers,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyKycDto } from './dto/verify-kyc.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit, RateLimitWindow } from '../../common/guards/rate-limit.guard';
import { OTPService } from '../../common/services/otp.service';

// DTOs for the new endpoints
export class VerifyEmailDto {
  otpId: string;
  otp: string;
}

export class ForgotPasswordDto {
  email: string;
}

export class ResetPasswordDto {
  token: string;
  newPassword: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class ResendOTPDto {
  otpId: string;
}

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OTPService,
  ) {}

  @Post('register')
  @RateLimit(3) // Max 3 registration attempts per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User successfully registered, email verification required' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.register(registerDto, ipAddress, userAgent || 'Unknown');
  }

  @Post('verify-email')
  @RateLimit(5) // Max 5 verification attempts per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Verify email address with OTP' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        otpId: { type: 'string', description: 'OTP ID from registration response' },
        otp: { type: 'string', description: '6-digit verification code' },
      },
      required: ['otpId', 'otp'],
    },
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.verifyEmail(verifyEmailDto.otpId, verifyEmailDto.otp, ipAddress);
  }

  @Post('resend-otp')
  @RateLimit(3) // Max 3 resend attempts per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Resend email verification OTP' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        otpId: { type: 'string', description: 'Original OTP ID' },
      },
      required: ['otpId'],
    },
  })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP ID' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resendOTP(@Body() resendOTPDto: ResendOTPDto) {
    return this.otpService.resendOTP(resendOTPDto.otpId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit(5) // Max 5 login attempts per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Login user with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account locked' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ipAddress, userAgent || 'Unknown');
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @RateLimit(10) // Max 10 refresh attempts per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', description: 'Refresh token from login response' },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken, ipAddress);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit(3) // Max 3 forgot password attempts per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', description: 'User email address' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset link sent (if email exists)' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto.email, ipAddress);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit(5) // Max 5 reset attempts per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Reset password using reset token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Password reset token from email' },
        newPassword: {
          type: 'string',
          minLength: 8,
          description: 'New password (minimum 8 characters)'
        },
      },
      required: ['token', 'newPassword'],
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
      ipAddress,
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @RateLimit(5) // Max 5 password change attempts per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Change user password (authenticated)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        currentPassword: { type: 'string', description: 'Current password' },
        newPassword: {
          type: 'string',
          minLength: 8,
          description: 'New password (minimum 8 characters)'
        },
      },
      required: ['currentPassword', 'newPassword'],
    },
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      ipAddress,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @RateLimit(10) // Max 10 logout attempts per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Logout user and invalidate session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.sessionId, req.user.id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RateLimit(20) // Max 20 profile requests per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('verify-kyc')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @RateLimit(3) // Max 3 KYC verification attempts per minute
  @RateLimitWindow(60000)
  @ApiOperation({ summary: 'Verify user KYC information' })
  @ApiResponse({ status: 200, description: 'KYC verification successful' })
  @ApiResponse({ status: 400, description: 'Invalid KYC information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async verifyKyc(@Request() req: any, @Body() verifyKycDto: VerifyKycDto) {
    // This method needs to be implemented in the auth service
    return { success: true, message: 'KYC verification endpoint - implementation pending' };
  }

  // Admin/Monitoring endpoints
  @Get('session-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get session statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Session statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getSessionStats(@Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return { success: false, message: 'Admin access required' };
    }

    return {
      success: true,
      data: this.authService.getSessionStatistics(),
      message: 'Session statistics retrieved',
    };
  }

  @Get('otp-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get OTP statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'OTP statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getOTPStats(@Request() req: any) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return { success: false, message: 'Admin access required' };
    }

    return {
      success: true,
      data: this.otpService.getOTPStatistics(),
      message: 'OTP statistics retrieved',
    };
  }
}