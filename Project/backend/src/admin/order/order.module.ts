import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminOrderService } from './order.service';
import { AdminOrderController } from './order.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminOrderController],
  providers: [AdminOrderService],
})
export class AdminOrderModule {}
