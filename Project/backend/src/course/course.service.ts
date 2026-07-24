import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { LessonService } from 'src/lesson/lesson.service';

@Injectable()
export class CourseService {
    private readonly thumbnailUploadDir = path.join(process.cwd(), 'uploads', 'thumbnails');
    
    constructor(
        private readonly prisma: PrismaService,
        private readonly lessonService: LessonService,
    ) {
        if (!fs.existsSync(this.thumbnailUploadDir)) {
            fs.mkdirSync(this.thumbnailUploadDir, { recursive: true });
        }
    }

    // Thêm khóa học
    async create(userId: string, createCourseDto: CreateCourseDto, thumbnail?: Express.Multer.File) {
        const currentUser = await this.prisma.users.findUnique({
            where: { id: userId },
        });
        if (!currentUser) {
            throw new ForbiddenException('Bạn không có quyền tạo khóa học');
        }

        const category = await this.prisma.categories.findUnique({
            where: { id: createCourseDto.category_id },
        });
        if (!category) {
            throw new BadRequestException('Danh mục không tồn tại');
        }

        let thumbnail_url = createCourseDto.thumbnail_url || null;

        if (thumbnail) {
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedMimeTypes.includes(thumbnail.mimetype)) {
                throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)');
            }

            const maxSize = 5 * 1024 * 1024;
            if (thumbnail.size > maxSize) {
                throw new BadRequestException('Kích thước file không được vượt quá 5MB');
            }

            const fileExtension = path.extname(thumbnail.originalname);
            const uniqueSuffix = randomUUID();
            const safeTitle = createCourseDto.title.toLowerCase().split(' ').join('_');
            const fileName = `${safeTitle}_${uniqueSuffix}${fileExtension}`;
            const filePath = path.join(this.thumbnailUploadDir, fileName);

            fs.writeFileSync(filePath, thumbnail.buffer);

            thumbnail_url = `/uploads/thumbnails/${fileName}`;
        }

        const course = await this.prisma.courses.create({
            data: {
                id: randomUUID(),
                instructor_id: currentUser.id,
                category_id: createCourseDto.category_id,
                title: createCourseDto.title,
                short_description: createCourseDto.short_description,
                description: createCourseDto.description,
                thumbnail_url: thumbnail_url,
                status: createCourseDto.status ?? 'DRAFT',
                level: (createCourseDto.level as any) ?? 'BEGINNER',
                price: createCourseDto.price ?? 0,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return {
            message: 'Thêm khóa học thành công',
            data: course,
        };
    }

    // Sửa khóa học
    async update(userId: string, id: string, updateCourseDto: UpdateCourseDto, thumbnail?: Express.Multer.File) {
        const course = await this.prisma.courses.findUnique({
            where: { id },
        });
        if (!course) {
            throw new NotFoundException('Khóa học không tồn tại');
        }
        if (course.instructor_id !== userId) {
            throw new ForbiddenException('Bạn không có quyền sửa khóa học này');
        }

        // Kiểm tra category mới nếu có
        if (updateCourseDto.category_id !== undefined) {
            const category = await this.prisma.categories.findUnique({
                where: { id: updateCourseDto.category_id },
            });
            if (!category) {
                throw new BadRequestException('Danh mục không tồn tại');
            }
        }


        const updateData: any = {
            updated_at: new Date(),
        };
        if (updateCourseDto.category_id !== undefined) updateData.category_id = updateCourseDto.category_id;
        if (updateCourseDto.title !== undefined) updateData.title = updateCourseDto.title;
        if (updateCourseDto.short_description !== undefined) updateData.short_description = updateCourseDto.short_description;
        if (updateCourseDto.description !== undefined) updateData.description = updateCourseDto.description;
        if (updateCourseDto.status !== undefined) updateData.status = updateCourseDto.status;
        if (updateCourseDto.level !== undefined) updateData.level = updateCourseDto.level;
        if (updateCourseDto.price !== undefined) updateData.price = updateCourseDto.price;

        if (thumbnail) {
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedMimeTypes.includes(thumbnail.mimetype)) {
                throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)');
            }

            const maxSize = 5 * 1024 * 1024;
            if (thumbnail.size > maxSize) {
                throw new BadRequestException('Kích thước file không được vượt quá 5MB');
            }

            if (course.thumbnail_url) {
                const oldThumbnailPath = path.join(process.cwd(), course.thumbnail_url);
                if (fs.existsSync(oldThumbnailPath)) {
                    fs.unlinkSync(oldThumbnailPath);
                }
            }

            const fileExtension = path.extname(thumbnail.originalname);
            const uniqueSuffix = randomUUID();
            const safeTitle = updateCourseDto.title?.toLowerCase().split(' ').join('_') || course.title.split(' ').join('_');
            const fileName = `${safeTitle}_${uniqueSuffix}${fileExtension}`;
            const filePath = path.join(this.thumbnailUploadDir, fileName);

            fs.writeFileSync(filePath, thumbnail.buffer);

            updateData.thumbnail_url = `/uploads/thumbnails/${fileName}`;
        }

        const updated = await this.prisma.courses.update({
            where: { id },
            data: updateData,
        });

        return {
            message: 'Cập nhật khóa học thành công',
            data: updated,
        };
    }

    async findMyCourses(userId: string) {
        const courses = await this.prisma.courses.findMany({
            where: {
                instructor_id: userId,
            },
            include: {
                categories: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        if (courses.length === 0) {
            return {
                message: 'Không có khóa học nào',
                data: [],
            };
        }

        return {
            data: courses,
        };
    }

 

    // Hiển thị chi tiết khóa học
    async findOne(id: string) {
        const course = await this.prisma.courses.findUnique({
            where: { id },
            include: {
                categories: {
                    select: { id: true, name: true },
                },
                course_sections: {
                    orderBy: { order_index: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { order_index: 'asc' },
                        },
                    },
                },
                course_group_items: {
                    include: {
                        course_groups: {
                            select: { id: true, title: true },
                        },
                    },
                },
            },
        });

        if (!course) {
            throw new NotFoundException('Khóa học không tồn tại');
        }

        // Sync Mux status for processing lessons in parallel
        if (course.course_sections) {
            for (const section of course.course_sections) {
                if (section.lessons) {
                    const synced = await Promise.all(
                        section.lessons.map(async (lesson) => {
                            if (lesson.mux_status === 'PROCESSING') {
                                return await this.lessonService.syncLessonMuxStatus(lesson.id);
                            }
                            return lesson;
                        })
                    );
                    section.lessons = synced.filter((l): l is typeof section.lessons[number] => l !== null);
                }
            }
        }

        return course;
    }

    // Ẩn khóa học (chuyển status thành HIDDEN)
    async hide(userId: string, id: string) {
        const course = await this.prisma.courses.findUnique({
            where: { id },
        });
        if (!course) {
            throw new NotFoundException('Khóa học không tồn tại');
        }
        if (course.instructor_id !== userId) {
            throw new ForbiddenException('Bạn không có quyền ẩn khóa học này');
        }
        if (course.status === 'HIDDEN') {
            throw new BadRequestException('Khóa học đã ở trạng thái ẩn');
        }

        const updated = await this.prisma.courses.update({
            where: { id },
            data: {
                status: 'HIDDEN',
                updated_at: new Date(),
            },
        });

        return {
            message: 'Ẩn khóa học thành công',
            data: updated,
        };
    }

    // Xóa khóa học (hard delete)
    async remove(userId: string, id: string) {
        const course = await this.prisma.courses.findUnique({
            where: { id },
        });
        if (!course) {
            throw new NotFoundException('Khóa học không tồn tại');
        }
        if (course.instructor_id !== userId) {
            throw new ForbiddenException('Bạn không có quyền xóa khóa học này');
        }

        const hasGroup = await this.prisma.course_group_items.findFirst({
            where: { course_id: id },
        });
        if (hasGroup) {
            throw new BadRequestException('Không thể xóa khóa học vì đã có trong nhóm khóa học');
        }

        // Kiểm tra nếu có học viên đã enroll thì không cho xóa
        const hasEnrollments = await this.prisma.enrollments.findFirst({
            where: { course_id: id },
        });
        if (hasEnrollments) {
            throw new BadRequestException('Không thể xóa khóa học vì đã có học viên đăng ký');
        }

        await this.prisma.course_group_items.deleteMany({
            where: { course_id: id },
        });


        const sections = await this.prisma.course_sections.findMany({
            where: { course_id: id },
            select: { id: true },
        });
        const sectionIds = sections.map(s => s.id);

        if (sectionIds.length > 0) {
            const lessons = await this.prisma.lessons.findMany({
                where: { section_id: { in: sectionIds } },
                select: { id: true },
            });
            const lessonIds = lessons.map(l => l.id);

            if (lessonIds.length > 0) {
                await this.prisma.lessons.deleteMany({
                    where: { id: { in: lessonIds } },
                });
            }

            await this.prisma.course_sections.deleteMany({
                where: { course_id: id },
            });
        }


        await this.prisma.promotion_courses.deleteMany({
            where: { course_id: id },
        });


        await this.prisma.courses.delete({
            where: { id },
        });

        return {
            message: 'Xóa khóa học thành công',
        };
    }
}
