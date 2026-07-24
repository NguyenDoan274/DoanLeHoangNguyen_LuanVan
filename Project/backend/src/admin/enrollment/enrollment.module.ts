import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminEnrollmentController } from './enrollment.controller';
import { AdminEnrollmentService } from './enrollment.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminEnrollmentController],
  providers: [AdminEnrollmentService],
})
export class AdminEnrollmentModule {}
