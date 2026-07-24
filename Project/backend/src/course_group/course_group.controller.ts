import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CourseGroupService } from './course_group.service';
import { CreateCourseGroupDto } from './dto/create-course_group.dto';
import { UpdateCourseGroupDto } from './dto/update-course_group.dto';
import { AddCourseToGroupDto } from './dto/add-course-to-group.dto';
import { ReorderCoursesInGroupDto } from './dto/reorder-courses-in-group.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('api/instructor')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles('INSTRUCTOR')
export class CourseGroupController {
    constructor (private readonly courseGroupService:CourseGroupService) {}

    //thêm khóa học
    @Post('course-groups')
    create(@CurrentUser('sub') userId: string ,@Body() createCourseGroupDto: CreateCourseGroupDto) {
        return this.courseGroupService.create(createCourseGroupDto,userId);
      }

    //hien ds cua toi
    @Get('course-groups')
    findMyGroups(@CurrentUser('sub') userId: string) {
        return this.courseGroupService.findMyGroups(userId);
    }

    //hien chi tiet
    @Get('course-groups/:id')
    findOne(@CurrentUser('sub') userId: string ,@Param('id') id: string) {
        return this.courseGroupService.findOne(userId,id);
    }

    //hien danh sach danh muc
    @Get('categories')
    findAllCategories() {
        return this.courseGroupService.findAllCategories();
    }

    //sua
    @Patch('course-groups/:id')
    update(
        @CurrentUser('sub') userId: string,
        @Param('id') id: string,
        @Body() updateCourseGroupDto: UpdateCourseGroupDto,
    ) {
        return this.courseGroupService.update(userId, id, updateCourseGroupDto);
    }

    //xoa
    @Delete('course-groups/:id')
    remove(
        @CurrentUser('sub') userId: string,
        @Param('id') id: string,
    ) {
        return this.courseGroupService.remove(userId, id);
    }

    // ===================== COURSE GROUP ITEMS =====================

    // Thêm khóa học vào nhóm
    @Post('course-groups/:id/courses')
    addCourseToGroup(
        @CurrentUser('sub') userId: string,
        @Param('id') groupId: string,
        @Body() dto: AddCourseToGroupDto,
    ) {
        return this.courseGroupService.addCourseToGroup(userId, groupId, dto);
    }

    @Get('course-groups/:id/courses')
    getCoursesInGroup(
        @CurrentUser('sub') userId: string,
        @Param('id') groupId: string,
    ) {
        return this.courseGroupService.getCoursesInGroup(userId, groupId);
    }

    // Xóa khóa học khỏi nhóm
    @Delete('course-groups/:id/courses/:courseId')
    removeCourseFromGroup(
        @CurrentUser('sub') userId: string,
        @Param('id') groupId: string,
        @Param('courseId') courseId: string,
    ) {
        return this.courseGroupService.removeCourseFromGroup(userId, groupId, courseId);
    }

    // Sắp xếp thứ tự khóa học trong nhóm
    @Patch('course-groups/:id/courses/reorder')
    reorderCoursesInGroup(
        @CurrentUser('sub') userId: string,
        @Param('id') groupId: string,
        @Body() dto: ReorderCoursesInGroupDto,
    ) {
        return this.courseGroupService.reorderCoursesInGroup(userId, groupId, dto);
    }
}
