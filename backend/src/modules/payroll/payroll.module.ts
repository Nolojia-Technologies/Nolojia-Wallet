import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollBatch } from '../../database/entities/payroll-batch.entity';
import { PayrollEntry } from '../../database/entities/payroll-entry.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PayrollBatch, PayrollEntry, User])],
  controllers: [],
  providers: [],
  exports: [],
})
export class PayrollModule {}