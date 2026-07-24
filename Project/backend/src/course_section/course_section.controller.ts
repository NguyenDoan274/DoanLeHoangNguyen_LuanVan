import { Controller, UseGuards, Post, Body, Param, Get, Patch, Delete } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CourseSectionService } from './course_section.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateCourseSectionDto } from './dto/create-course-section.dto';
import { UpdateCourseSectionDto } from './dto/update-course-section.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('/api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseSectionController {
    constructor(private readonly courseSectionService: CourseSectionService) { }

    @Roles('INSTRUCTOR')
    @Post('instructor/courses/:id/sections')
    createSection(
        @Param('id') courseId: string,
        @CurrentUser('sub') userId: string,
        @Body() createCourseSectionDto: CreateCourseSectionDto,
    ) {
        return this.courseSectionService.createSection(userId, courseId, createCourseSectionDto);
    }

    @Roles('INSTRUCTOR')
    @Get('instructor/courses/:id/sections')
    findMyCourseSections(@CurrentUser('sub') userId: string, @Param('id') courseId: string) {
        return this.courseSectionService.findMyCourseSections(userId, courseId);
    }

    @Roles('INSTRUCTOR')
    @Get('instructor/courses/:id/sections/:sectionId')
    findMyCourseSection(@CurrentUser('sub') userId: string, @Param('id') courseId: string, @Param('sectionId') sectionId: string) {
        return this.courseSectionService.findMyCourseSection(userId, courseId, sectionId);
    }

    @Roles('INSTRUCTOR')
    @Patch('instructor/courses/:id/sections/:sectionId')
    updateSection(
        @Param('id') courseId: string,
        @Param('sectionId') sectionId: string,
        @CurrentUser('sub') userId: string,
        @Body() updateCourseSectionDto: UpdateCourseSectionDto,
    ) {
        return this.courseSectionService.updateSection(userId, courseId, sectionId, updateCourseSectionDto);
    }

    @Roles('INSTRUCTOR')
    @Delete('instructor/courses/:id/sections/:sectionId')
    removeSection(
        @Param('id') courseId: string,
        @Param('sectionId') sectionId: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.courseSectionService.removeSection(userId, courseId, sectionId);
    }
}
