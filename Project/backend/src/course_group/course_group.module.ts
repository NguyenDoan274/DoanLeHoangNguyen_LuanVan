import { Module } from '@nestjs/common';
import { CourseGroupService } from './course_group.service';
import { CourseGroupController } from './course_group.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [CourseGroupService],
  controllers: [CourseGroupController]
})
export class CourseGroupModule {}
