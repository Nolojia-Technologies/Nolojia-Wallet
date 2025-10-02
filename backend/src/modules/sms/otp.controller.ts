import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Get,
  Req,
} from '@nestjs/common';
import { OtpService, GenerateOtpDto, VerifyOtpDto } from './otp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OtpPurpose } from './entities/otp.entity';

class SendOtpDto {
  phoneNumber: string;
  purpose: OtpPurpose;
  metadata?: Record<string, any>;
}

class VerifyOtpRequestDto {
  phoneNumber: string;
  otp: string;
  purpose: OtpPurpose;
}

@ApiTags('OTP')
@Controller('api/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendOtp(@Body() body: SendOtpDto, @Req() req: any) {
    const userId = req.user.id;

    const generateOtpDto: GenerateOtpDto = {
      userId,
      phoneNumber: body.phoneNumber,
      purpose: body.purpose,
      metadata: body.metadata,
    };

    const result = await this.otpService.generateAndSendOtp(generateOtpDto);

    return {
      success: result.success,
      message: result.message,
      expiresAt: result.expiresAt,
      attemptsRemaining: result.attemptsRemaining,
    };
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() body: VerifyOtpRequestDto, @Req() req: any) {
    const userId = req.user.id;

    const verifyOtpDto: VerifyOtpDto = {
      userId,
      phoneNumber: body.phoneNumber,
      otp: body.otp,
      purpose: body.purpose,
    };

    const result = await this.otpService.verifyOtp(verifyOtpDto);

    return {
      success: result.success,
      message: result.message,
    };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get OTP history for current user' })
  @ApiResponse({ status: 200, description: 'OTP history retrieved successfully' })
  async getOtpHistory(@Req() req: any) {
    const userId = req.user.id;
    const history = await this.otpService.getOtpHistory(userId);

    return {
      success: true,
      data: history,
    };
  }

  @Post('send-public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for public endpoints (signup, password reset)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendPublicOtp(@Body() body: { phoneNumber: string; purpose: 'SIGNUP' | 'PASSWORD_RESET'; tempUserId?: string }) {
    const generateOtpDto: GenerateOtpDto = {
      userId: body.tempUserId || `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      phoneNumber: body.phoneNumber,
      purpose: body.purpose as OtpPurpose,
    };

    const result = await this.otpService.generateAndSendOtp(generateOtpDto);

    return {
      success: result.success,
      message: result.message,
      tempUserId: generateOtpDto.userId,
      expiresAt: result.expiresAt,
      attemptsRemaining: result.attemptsRemaining,
    };
  }

  @Post('verify-public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for public endpoints' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyPublicOtp(@Body() body: { phoneNumber: string; otp: string; purpose: 'SIGNUP' | 'PASSWORD_RESET'; tempUserId: string }) {
    const verifyOtpDto: VerifyOtpDto = {
      userId: body.tempUserId,
      phoneNumber: body.phoneNumber,
      otp: body.otp,
      purpose: body.purpose as OtpPurpose,
    };

    const result = await this.otpService.verifyOtp(verifyOtpDto);

    return {
      success: result.success,
      message: result.message,
    };
  }
}