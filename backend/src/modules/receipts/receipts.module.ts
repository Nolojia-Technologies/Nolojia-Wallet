import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalReceipt } from '../../database/entities/digital-receipt.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DigitalReceipt, Transaction, User])],
  controllers: [],
  providers: [],
  exports: [],
})
export class ReceiptsModule {}