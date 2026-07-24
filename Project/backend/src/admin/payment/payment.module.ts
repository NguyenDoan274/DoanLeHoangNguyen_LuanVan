import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminPaymentController } from './payment.controller';
import { AdminPaymentService } from './payment.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminPaymentController],
  providers: [AdminPaymentService],
})
export class AdminPaymentModule {}
