import { Module } from '@nestjs/common';
import { AdminRevenueController, InstructorRevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminRevenueController, InstructorRevenueController],
  providers: [RevenueService],
})
export class RevenueModule {}
