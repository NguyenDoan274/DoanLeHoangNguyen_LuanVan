import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { AuthModule } from 'src/auth/auth.module';
import { LessonModule } from 'src/lesson/lesson.module';

@Module({
  imports: [AuthModule, LessonModule],
  providers: [CourseService],
  controllers: [CourseController],
})
export class CourseModule {}
