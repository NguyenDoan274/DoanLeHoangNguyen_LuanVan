import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)

export class CourseController {
    constructor(private readonly courseService: CourseService) { }

    @Roles('INSTRUCTOR')
    @Post('instructor/courses')
    @UseInterceptors(FileInterceptor('thumbnail'))
    create(
        @CurrentUser('sub') userId: string,
        @Body() createCourseDto: CreateCourseDto,
        @UploadedFile() thumnail?: Express.Multer.File,
    ) {
        return this.courseService.create(userId, createCourseDto, thumnail);
    }

    @Roles('INSTRUCTOR')
    @Get('instructor/courses')
    findMyCourses(@CurrentUser('sub') userId: string) {
        return this.courseService.findMyCourses(userId);
    }

    @Roles('INSTRUCTOR')
    @Get('instructor/courses/:id')
    findOne(
        @Param('id') id: string,
    ) {
        return this.courseService.findOne(id);
    }

    @Roles('INSTRUCTOR')
    @Patch('instructor/courses/:id')
    @UseInterceptors(FileInterceptor('thumbnail'))
    update(
        @CurrentUser('sub') userId: string,
        @Param('id') id: string,
        @Body() updateCourseDto: UpdateCourseDto,
        @UploadedFile() thumbnail?: Express.Multer.File,
    ) {
        return this.courseService.update(userId, id, updateCourseDto, thumbnail);
    }

    @Roles('INSTRUCTOR')
    @Patch('instructor/courses/:id/hide')
    hide(
        @CurrentUser('sub') userId: string,
        @Param('id') id: string,
    ) {
        return this.courseService.hide(userId, id);
    }

    @Roles('INSTRUCTOR')
    @Delete('instructor/courses/:id')
    remove(
        @CurrentUser('sub') userId: string,
        @Param('id') id: string,
    ) {
        return this.courseService.remove(userId, id);
    }
}
