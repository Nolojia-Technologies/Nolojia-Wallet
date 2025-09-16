import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudReport } from '../../database/entities/fraud-report.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FraudReport, User])],
  controllers: [],
  providers: [],
  exports: [],
})
export class FraudModule {}