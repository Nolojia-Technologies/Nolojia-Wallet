import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowTransaction } from '../../database/entities/escrow-transaction.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EscrowTransaction, Transaction, User])],
  controllers: [],
  providers: [],
  exports: [],
})
export class EscrowModule {}