import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { AuthModule } from 'src/auth/auth.module';
import { LessonModule } from 'src/lesson/lesson.module';

@Module({
  imports: [AuthModule, LessonModule],
  controllers: [PublicController],
  providers: [PublicService]
})
export class PublicModule {}
