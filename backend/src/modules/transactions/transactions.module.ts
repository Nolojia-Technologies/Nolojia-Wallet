import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../database/entities/transaction.entity';
import { Wallet } from '../../database/entities/wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Wallet])],
  controllers: [],
  providers: [],
  exports: [],
})
export class TransactionsModule {}