import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Configuration
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { TopUpModule } from './modules/topup/topup.module';
import { SmsModule } from './modules/sms/sms.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync(databaseConfig),

    // JWT
    JwtModule.registerAsync(jwtConfig),

    // Feature modules
    EmailModule,
    AuthModule,
    WalletModule,
    TransactionsModule,
    EscrowModule,
    FraudModule,
    ReceiptsModule,
    PayrollModule,
    TopUpModule,
    SmsModule,
  ],
})
export class AppModule {}