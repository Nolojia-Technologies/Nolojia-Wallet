import { Module, Global } from '@nestjs/common';
import { SmsService } from './sms.service';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { SmsTestController } from './test.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpEntity } from './entities/otp.entity';
import { NotificationService } from './notification.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OtpEntity])],
  providers: [SmsService, OtpService, NotificationService],
  controllers: [OtpController, SmsTestController],
  exports: [SmsService, OtpService, NotificationService],
})
export class SmsModule {}