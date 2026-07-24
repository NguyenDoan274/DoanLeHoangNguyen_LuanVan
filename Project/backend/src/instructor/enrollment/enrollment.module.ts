import { Module } from '@nestjs/common';
import { InstructorEnrollmentController } from './enrollment.controller';
import { InstructorEnrollmentService } from './enrollment.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [InstructorEnrollmentController],
  providers: [InstructorEnrollmentService],
})
export class InstructorEnrollmentModule {}
