import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseSectionDto } from './dto/create-course-section.dto';
import { randomUUID } from 'crypto';
import { UpdateCourseSectionDto } from './dto/update-course-section.dto';

@Injectable()
export class CourseSectionService {
    constructor(private readonly prisma: PrismaService){}
     // Helper kiểm tra quyền sở hữu khóa học
        private async verifyCourseOwnership(userId: string, courseId: string) {
            const course = await this.prisma.courses.findUnique({
                where: { id: courseId },
            });
            if (!course) {
                throw new NotFoundException('Khóa học không tồn tại');
            }
            if (course.instructor_id !== userId) {
                throw new ForbiddenException('Bạn không có quyền thao tác trên khóa học này');
            }
            return course;
        }
    
        // Thêm chương học
        async createSection(userId: string, courseId: string, dto: CreateCourseSectionDto) {
            await this.verifyCourseOwnership(userId, courseId);
    
            let orderIndex = dto.order_index;
            if (orderIndex === undefined) {
                const lastSection = await this.prisma.course_sections.findFirst({
                    where: { course_id: courseId },
                    orderBy: { order_index: 'desc' },
                });
                orderIndex = lastSection ? lastSection.order_index + 1 : 0;
            }
    
            const section = await this.prisma.course_sections.create({
                data: {
                    id: randomUUID(),
                    course_id: courseId,
                    title: dto.title,
                    description: dto.description || null,
                    order_index: orderIndex,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
    
            return {
                message: 'Thêm chương học thành công',
                data: section,
            };
        }
    
        async findMyCourseSections(userId: string, courseId: string) {
            await this.verifyCourseOwnership(userId, courseId)
            const sections = await this.prisma.course_sections.findMany({
                where: {
                    course_id: courseId
                },
                orderBy: {
                    order_index: "asc"
                }
            });
            if (sections.length == 0) {
                return { message: 'Không tìm thấy chương học nào', data: [] };
            }
    
            return {
                data: sections,
            };
        }
    
        // Tìm chi tiết một chương học
        async findMyCourseSection(userId: string, courseId: string, sectionId: string) {
            await this.verifyCourseOwnership(userId, courseId);
    
            const section = await this.prisma.course_sections.findUnique({
                where: { id: sectionId },
            });
    
            if (!section) {
                throw new NotFoundException('Không tìm thấy chương học');
            }
    
            if (section.course_id !== courseId) {
                throw new BadRequestException('Chương học không thuộc khóa học này');
            }
    
            return {
                data: section,
            };
        }
    
        // Sửa chương học
        async updateSection(userId: string, courseId: string, sectionId: string, dto: UpdateCourseSectionDto) {
            await this.verifyCourseOwnership(userId, courseId);
    
            const section = await this.prisma.course_sections.findUnique({
                where: { id: sectionId },
            });
            if (!section) {
                throw new NotFoundException('Chương học không tồn tại');
            }
            if (section.course_id !== courseId) {
                throw new BadRequestException('Chương học không thuộc khóa học này');
            }
    
            const updateData: any = {
                updated_at: new Date(),
            };
            if (dto.title !== undefined) updateData.title = dto.title;
            if (dto.description !== undefined) updateData.description = dto.description;
            if (dto.order_index !== undefined) updateData.order_index = dto.order_index;
    
            const updatedSection = await this.prisma.course_sections.update({
                where: { id: sectionId },
                data: updateData,
            });
    
            return {
                message: 'Cập nhật chương học thành công',
                data: updatedSection,
            };
        }
    
        // Xóa chương học
        async removeSection(userId: string, courseId: string, sectionId: string) {
            await this.verifyCourseOwnership(userId, courseId);
    
            const section = await this.prisma.course_sections.findUnique({
                where: { id: sectionId },
            });
            if (!section) {
                throw new NotFoundException('Chương học không tồn tại');
            }
            if (section.course_id !== courseId) {
                throw new BadRequestException('Chương học không thuộc khóa học này');
            }
    
            // Kiểm tra xem có bài học nào trong chương học này không
            const hasLessons = await this.prisma.lessons.findFirst({
                where: { section_id: sectionId },
            });
            if (hasLessons) {
                throw new BadRequestException('Không thể xóa chương học vì có bài học bên trong');
            }
    
            await this.prisma.course_sections.delete({
                where: { id: sectionId },
            });
    
            return {
                message: 'Xóa chương học thành công',
            };
        }
}
