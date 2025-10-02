import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TopUpController } from './topup.controller';
import { TopUpService } from './topup.service';
import { MpesaService } from './services/mpesa.service';
import { BankTransferService } from './services/bank-transfer.service';
import { Wallet } from '../../database/entities/wallet.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { User } from '../../database/entities/user.entity';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { TransactionSecurityGuard } from '../../common/guards/transaction-security.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction, User]),
    ConfigModule,
  ],
  controllers: [TopUpController],
  providers: [
    TopUpService,
    MpesaService,
    BankTransferService,
    RateLimitGuard,
    TransactionSecurityGuard,
  ],
  exports: [TopUpService, MpesaService, BankTransferService],
})
export class TopUpModule {}