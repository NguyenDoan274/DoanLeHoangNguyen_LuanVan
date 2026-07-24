import { Controller, Get, UseGuards } from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/instructor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Get('stats')
  getStats(@CurrentUser('sub') instructorId: string) {
    return this.instructorService.getDashboardStats(instructorId);
  }
}
