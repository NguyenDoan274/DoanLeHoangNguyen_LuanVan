import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { InstructorEnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('api/instructor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class InstructorEnrollmentController {
  constructor(private readonly enrollmentService: InstructorEnrollmentService) {}

  @Get('enrollments')
  findAll(
    @CurrentUser('sub') instructorId: string,
    @Query('course_id') courseId?: string,
  ) {
    return this.enrollmentService.findAll(instructorId, courseId);
  }

  @Get('courses/:courseId/students')
  findStudentsByCourse(
    @CurrentUser('sub') instructorId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentService.findStudentsByCourse(instructorId, courseId);
  }
}
