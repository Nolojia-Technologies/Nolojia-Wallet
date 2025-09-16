import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { AccountType } from '../../../database/entities/user.entity';

export class RegisterDto {
  @ApiProperty({
    example: AccountType.PERSONAL,
    enum: AccountType,
    description: 'Account type: PERSONAL or COMPANY'
  })
  @IsEnum(AccountType, { message: 'Account type must be PERSONAL or COMPANY' })
  @IsNotEmpty()
  accountType: AccountType;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+254[17]\d{8}$/, {
    message: 'Please provide a valid Kenyan phone number (e.g., +254712345678)',
  })
  phone: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @ApiProperty({ example: '12345678', required: false })
  @ValidateIf((o) => o.accountType === AccountType.PERSONAL)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$/, {
    message: 'National ID must be 8 digits',
  })
  nationalId?: string;

  @ApiProperty({ example: 'Acme Corporation', required: false })
  @ValidateIf((o) => o.accountType === AccountType.COMPANY)
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Company name must be at least 2 characters' })
  @MaxLength(100, { message: 'Company name must not exceed 100 characters' })
  companyName?: string;

  @ApiProperty({ example: 'CPR/101/2021', required: false })
  @ValidateIf((o) => o.accountType === AccountType.COMPANY)
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}\/\d{3}\/\d{4}$/, {
    message: 'Company registration number must be in format: CPR/101/2021',
  })
  companyRegistrationNumber?: string;

  @ApiProperty({ example: 'A000000000A', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]\d{9}[A-Z]$/, {
    message: 'KRA PIN must be in the format: A000000000A',
  })
  kraPin?: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;
}