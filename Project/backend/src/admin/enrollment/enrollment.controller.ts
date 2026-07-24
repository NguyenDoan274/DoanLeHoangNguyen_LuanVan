import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { AdminEnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('api/admin/enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminEnrollmentController {
  constructor(private readonly enrollmentService: AdminEnrollmentService) {}

  @Get()
  findAll(
    @Query('student_id') studentId?: string,
    @Query('course_id') courseId?: string,
    @Query('instructor_id') instructorId?: string,
    @Query('status') status?: string,
  ) {
    return this.enrollmentService.findAll({
      student_id: studentId,
      course_id: courseId,
      instructor_id: instructorId,
      status,
    });
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.enrollmentService.activate(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.enrollmentService.cancel(id);
  }

  @Get(':id/order')
  getOrder(@Param('id') id: string) {
    return this.enrollmentService.getOrder(id);
  }

  @Get(':id/payment')
  getPayment(@Param('id') id: string) {
    return this.enrollmentService.getPayment(id);
  }
}
