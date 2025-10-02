import { IsString, IsNumber, IsOptional, IsPositive, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateTopUpDto {
  @ApiProperty({
    description: 'Payment method',
    enum: ['mpesa', 'card', 'bank', 'crypto', 'paypal', 'ussd'],
  })
  @IsString()
  @IsIn(['mpesa', 'card', 'bank', 'crypto', 'paypal', 'ussd'])
  method: string;

  @ApiProperty({
    description: 'Top-up amount in KES',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Phone number for M-Pesa payments',
    example: '0712345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}