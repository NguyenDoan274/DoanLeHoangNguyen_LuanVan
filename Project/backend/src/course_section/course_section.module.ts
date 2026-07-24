import { Module } from '@nestjs/common';
import { CourseSectionService } from './course_section.service';
import { CourseSectionController } from './course_section.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [CourseSectionService],
  controllers: [CourseSectionController]
})
export class CourseSectionModule { }
