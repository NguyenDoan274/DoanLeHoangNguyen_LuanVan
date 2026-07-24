import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { AuthModule } from 'src/auth/auth.module';
import { LessonController } from './lesson.controller';

@Module({
  imports: [AuthModule],
  providers: [LessonService],
  controllers: [LessonController],
  exports: [LessonService]
})
export class LessonModule { }
