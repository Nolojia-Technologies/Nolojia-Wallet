import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTopUpDto {
  @ApiProperty({
    description: 'Transaction ID to verify',
    example: 'txn_123456789',
  })
  @IsString()
  transactionId: string;
}