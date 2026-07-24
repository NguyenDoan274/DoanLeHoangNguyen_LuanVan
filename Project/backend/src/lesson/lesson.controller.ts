import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonController {
    constructor(private readonly lessonService: LessonService) {}

    @Roles('INSTRUCTOR')
    @Post('instructor/courses/:id/sections/:sectionId/lessons')
    @UseInterceptors(FileInterceptor('video'))
    createLesson(
        @Param('id') courseId: string,
        @Param('sectionId') sectionId: string,
        @CurrentUser('sub') userId: string,
        @Body() createLessonDto: CreateLessonDto,
        @UploadedFile() video?: Express.Multer.File,
    ) {
        return this.lessonService.createLesson(userId, courseId, sectionId, createLessonDto, video);
    }
    @Roles('INSTRUCTOR')
    @Get('instructor/courses/:id/sections/:sectionId/lessons')
    findLessons(
        @CurrentUser('sub') userId: string,
        @Param('id') courseId: string,
        @Param('sectionId') sectionId: string,
    ) {
        return this.lessonService.findLessons(userId, courseId, sectionId);
    }
    
    @Roles('INSTRUCTOR')
    @Get('instructor/courses/:id/sections/:sectionId/lessons/:lessonId')
    findLessonDetail(
        @CurrentUser('sub') userId: string,
        @Param('id') courseId: string,
        @Param('sectionId') sectionId: string,
        @Param('lessonId') lessonId: string,
    ) {
        return this.lessonService.findLessonDetail(userId, courseId, sectionId, lessonId);
    }
    @Roles('INSTRUCTOR')
    @Patch('instructor/courses/:id/sections/:sectionId/lessons/:lessonId')
    @UseInterceptors(FileInterceptor('video'))
    updateLesson(
        @Param('id') courseId: string,
        @Param('sectionId') sectionId: string,
        @Param('lessonId') lessonId: string,
        @CurrentUser('sub') userId: string,
        @Body() updateLessonDto: UpdateLessonDto,
        @UploadedFile() video?: Express.Multer.File,
    ) {
        return this.lessonService.updateLesson(userId, courseId, sectionId, lessonId, updateLessonDto, video);
    }
    
    @Roles('INSTRUCTOR')
    @Delete('instructor/courses/:id/sections/:sectionId/lessons/:lessonId')
    removeLesson(
        @Param('id') courseId: string,
        @Param('sectionId') sectionId: string,
        @Param('lessonId') lessonId: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.lessonService.removeLesson(userId, courseId, sectionId, lessonId);
    }
}
