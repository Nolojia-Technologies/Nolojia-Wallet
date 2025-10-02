import { Controller, Post, Get, Body, Param, UseGuards, Request, HttpCode, HttpStatus, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TopUpService } from './topup.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit, RateLimitWindow } from '../../common/guards/rate-limit.guard';
import { TransactionSecurityGuard } from '../../common/guards/transaction-security.guard';
import { InitiateTopUpDto } from './dto/initiate-topup.dto';
import { VerifyTopUpDto } from './dto/verify-topup.dto';

@ApiTags('Top Up')
@Controller('topup')
export class TopUpController {
  constructor(private readonly topUpService: TopUpService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard, RateLimitGuard, TransactionSecurityGuard)
  @RateLimit(3) // Max 3 initiation attempts per minute
  @RateLimitWindow(60000) // 1 minute window
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a wallet top-up transaction' })
  @ApiResponse({ status: 201, description: 'Top-up initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async initiateTopUp(@Request() req: any, @Body() dto: InitiateTopUpDto) {
    return await this.topUpService.initiateTopUp(req.user.id, dto);
  }

  @Get('verify/:transactionId')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(10) // Max 10 verification attempts per minute
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify transaction status' })
  @ApiResponse({ status: 200, description: 'Transaction status retrieved' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async verifyTopUp(@Param('transactionId') transactionId: string) {
    return await this.topUpService.verifyTopUp(transactionId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(20) // Max 20 history requests per minute
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top-up transaction history' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getTopUpHistory(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.topUpService.getTopUpHistory(req.user.id, page, limit);
  }

  @Post('cancel/:transactionId')
  @UseGuards(JwtAuthGuard, RateLimitGuard, TransactionSecurityGuard)
  @RateLimit(5) // Max 5 cancellation attempts per minute
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel pending top-up transaction' })
  @ApiResponse({ status: 200, description: 'Transaction cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async cancelTopUp(@Param('transactionId') transactionId: string, @Request() req: any) {
    return await this.topUpService.cancelTopUp(transactionId, req.user.id);
  }

  // Webhook endpoints for payment providers (no authentication required)
  @Post('webhook/mpesa')
  @UseGuards(RateLimitGuard)
  @RateLimit(100) // Allow high rate for webhooks
  @RateLimitWindow(60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'M-Pesa payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload' })
  async handleMpesaWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature?: string,
  ) {
    return await this.topUpService.handleMpesaWebhook(payload, signature);
  }

  @Post('webhook/bank')
  @UseGuards(RateLimitGuard)
  @RateLimit(100) // Allow high rate for webhooks
  @RateLimitWindow(60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bank transfer webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload' })
  async handleBankWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ) {
    return await this.topUpService.handleBankWebhook(payload, signature);
  }
}