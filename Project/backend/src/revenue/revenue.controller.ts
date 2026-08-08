import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// ─────────────────────────────────────────────
// ADMIN Revenue Controller
// ─────────────────────────────────────────────
@Controller('api/admin/revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminRevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('summary')
  getSummary(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.revenueService.getAdminSummary(m, y);
  }

  @Get('instructors')
  getMonthlyByInstructors(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('search') search?: string,
  ) {
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const y = parseInt(year, 10) || new Date().getFullYear();
    return this.revenueService.getAdminMonthlyByInstructors(m, y, search);
  }

  @Get('instructors/:id')
  getInstructorDetail(
    @Param('id') instructorId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.revenueService.getAdminInstructorDetail(instructorId, m, y);
  }
}

// ─────────────────────────────────────────────
// INSTRUCTOR Revenue Controller
// ─────────────────────────────────────────────
@Controller('api/instructor/revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class InstructorRevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('summary')
  getSummary(
    @CurrentUser('sub') instructorId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.revenueService.getInstructorSummary(instructorId, m, y);
  }

  @Get('courses')
  getMonthlyCourses(
    @CurrentUser('sub') instructorId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const y = parseInt(year, 10) || new Date().getFullYear();
    return this.revenueService.getInstructorMonthlyCourses(instructorId, m, y);
  }
}
