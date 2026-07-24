import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {

  constructor(private readonly adminService: AdminService) {}
      
      @Get('admin/courses')
      findAll(@Query('name') name?: string) {
          return this.adminService.findAllCoursesForAdmin(name);
      }

      @Get('admin/courses/:id')
      findOne(@Param('id') id: string) {
          return this.adminService.findOneCourse(id);
      }

      @Patch('admin/courses/:id')
      update(
          @Param('id') id: string,
          @Body() updateData: { is_recommend?: boolean; status?: any }
      ) {
          return this.adminService.updateCourse(id, updateData);
      }

      @Get('admin/stats')
      getStats() {
          return this.adminService.getDashboardStats();
      }
}