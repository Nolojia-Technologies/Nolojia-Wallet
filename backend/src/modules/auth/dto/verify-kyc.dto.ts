import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Matches } from 'class-validator';

export class VerifyKycDto {
  @ApiProperty({ example: 'A000000000A', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]\d{9}[A-Z]$/, {
    message: 'KRA PIN must be in the format: A000000000A',
  })
  kraPin?: string;
}