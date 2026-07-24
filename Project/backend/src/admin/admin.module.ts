import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from 'src/auth/auth.module';
import { AdminOrderController } from './order/order.controller';
import { AdminOrderService } from './order/order.service';
import { AdminPaymentController } from './payment/payment.controller';
import { AdminPaymentService } from './payment/payment.service';
import { AdminEnrollmentController } from './enrollment/enrollment.controller';
import { AdminEnrollmentService } from './enrollment/enrollment.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminController, AdminOrderController, AdminPaymentController, AdminEnrollmentController],
  providers: [AdminService, AdminOrderService, AdminPaymentService, AdminEnrollmentService]
})
export class AdminModule { }
