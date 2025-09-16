import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User, TrustStatus, AccountType, UserRole } from '../../database/entities/user.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { CompanyProfile } from '../../database/entities/company-profile.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyKycDto } from './dto/verify-kyc.dto';
import { generateUserCode } from '../../common/utils/user-code.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(CompanyProfile)
    private readonly companyProfileRepository: Repository<CompanyProfile>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Build conditions for checking existing users based on account type
    const existingUserConditions: any[] = [
      { email: registerDto.email },
      { phone: registerDto.phone },
    ];

    // Add specific conditions based on account type
    if (registerDto.accountType === AccountType.PERSONAL && registerDto.nationalId) {
      existingUserConditions.push({ nationalId: registerDto.nationalId });
    }
    if (registerDto.accountType === AccountType.COMPANY && registerDto.companyRegistrationNumber) {
      existingUserConditions.push({ companyRegistrationNumber: registerDto.companyRegistrationNumber });
    }

    const existingUser = await this.userRepository.findOne({
      where: existingUserConditions,
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.phone === registerDto.phone) {
        throw new ConflictException('Phone number already registered');
      }
      if (registerDto.accountType === AccountType.PERSONAL && existingUser.nationalId === registerDto.nationalId) {
        throw new ConflictException('National ID already registered');
      }
      if (registerDto.accountType === AccountType.COMPANY && existingUser.companyRegistrationNumber === registerDto.companyRegistrationNumber) {
        throw new ConflictException('Company registration number already registered');
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Generate unique user code
    let userCode: string;
    do {
      userCode = generateUserCode();
    } while (await this.userRepository.findOne({ where: { userCode } }));

    // Set default role based on account type
    const defaultRole = registerDto.accountType === AccountType.COMPANY
      ? UserRole.COMPANY_ADMIN
      : UserRole.USER;

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      userCode,
      role: defaultRole,
      trustScore: 5.0,
      trustStatus: TrustStatus.CLEAN,
    });

    const savedUser = await this.userRepository.save(user);

    // Create company profile for company accounts
    if (registerDto.accountType === AccountType.COMPANY && registerDto.companyName) {
      const companyProfile = this.companyProfileRepository.create({
        companyName: registerDto.companyName,
        registrationNumber: registerDto.companyRegistrationNumber,
        kraPin: registerDto.kraPin,
        ownerId: savedUser.id,
      });
      await this.companyProfileRepository.save(companyProfile);
    }

    // Create wallet for user
    const wallet = this.walletRepository.create({
      userId: savedUser.id,
      balance: 0,
      escrowBalance: 0,
      currency: 'KES',
    });

    await this.walletRepository.save(wallet);

    // Generate JWT token with role-based information
    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      accountType: savedUser.accountType,
      role: savedUser.role,
      userCode: savedUser.userCode
    };
    const token = this.jwtService.sign(payload);

    // Remove password from response
    const { password, ...userResponse } = savedUser;

    return {
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: 'Registration successful',
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Generate JWT token with role-based information
    const payload = {
      sub: user.id,
      email: user.email,
      accountType: user.accountType,
      role: user.role,
      userCode: user.userCode
    };
    const token = this.jwtService.sign(payload);

    // Remove password from response
    const { password, ...userResponse } = user;

    return {
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: 'Login successful',
    };
  }

  async verifyKyc(userId: string, verifyKycDto: VerifyKycDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // In a real application, you would integrate with KRA API here
    // For now, we'll simulate the verification process
    const isKycValid = await this.validateKycWithKRA(
      user.nationalId,
      verifyKycDto.kraPin,
    );

    if (!isKycValid) {
      throw new BadRequestException('KYC verification failed');
    }

    // Update user verification status
    user.isVerified = true;
    user.kraPin = verifyKycDto.kraPin;
    await this.userRepository.save(user);

    return {
      success: true,
      data: { verified: true },
      message: 'KYC verification successful',
    };
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
    const { password, ...userResponse } = user;

    return {
      success: true,
      data: userResponse,
      message: 'Profile retrieved successfully',
    };
  }

  async refreshToken(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid user');
    }

    // Generate new JWT token with role-based information
    const payload = {
      sub: user.id,
      email: user.email,
      accountType: user.accountType,
      role: user.role,
      userCode: user.userCode
    };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      data: { token },
      message: 'Token refreshed successfully',
    };
  }

  async logout(userId: string) {
    // In a real application, you might want to maintain a blacklist of tokens
    // or use Redis to store and invalidate tokens
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  private async validateKycWithKRA(nationalId: string, kraPin?: string): Promise<boolean> {
    // This is a mock implementation
    // In a real application, you would make an API call to KRA
    // to validate the National ID and KRA PIN

    // Basic validation: National ID should be 8 digits
    if (!/^\d{8}$/.test(nationalId)) {
      return false;
    }

    // If KRA PIN is provided, it should be in the format: A000000000A
    if (kraPin && !/^[A-Z]\d{9}[A-Z]$/.test(kraPin)) {
      return false;
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo purposes, consider KYC valid if National ID starts with '1', '2', or '3'
    return ['1', '2', '3'].includes(nationalId.charAt(0));
  }
}