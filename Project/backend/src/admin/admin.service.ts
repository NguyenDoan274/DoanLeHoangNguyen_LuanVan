import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { course_status } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

     async findAllCoursesForAdmin(name?: string) {
        const courses = await this.prisma.courses.findMany({
            where: name
                ? {
                    title: {
                        contains: name,
                        mode: 'insensitive'
                    }
                }
                : {},
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                level: true,
                price: true,
                is_recommend: true,
                thumbnail_url: true,
                created_at: true,
                updated_at: true,
                categories: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                users: {
                    select: {
                        id: true,
                        full_name: true,
                    },
                }
            }
        })
        return {
            data: courses,
        }
    }

     async findOneCourse(id: string) {
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
                users: {
                    select: { id: true, full_name: true },
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

        return course;
    }

    async updateCourse(id: string, updateData: { is_recommend?: boolean; status?: course_status }) {
        const course = await this.prisma.courses.findUnique({
            where: { id },
        });

        if (!course) {
            throw new NotFoundException('Khóa học không tồn tại');
        }

        if (updateData.status && !['DRAFT', 'PUBLISHED', 'HIDDEN'].includes(updateData.status)) {
            throw new ConflictException('Trạng thái khóa học không hợp lệ');
        }

        const updatedCourse = await this.prisma.courses.update({
            where: { id },
            data: {
                ...(updateData.is_recommend !== undefined && { is_recommend: updateData.is_recommend }),
                ...(updateData.status !== undefined && { status: updateData.status }),
            },
        });

        return updatedCourse;
    }

    async getDashboardStats() {
        const totalUsers = await this.prisma.users.count(
            {where: {role: 'STUDENT'}}
        );
        const totalCourses = await this.prisma.courses.count();
        const totalOrders = await this.prisma.orders.count();
        const successPayments = await this.prisma.payments.findMany({
            where: { status: 'SUCCESS' },
            select: { amount: true },
        });
        const totalRevenue = successPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        return {
            totalUsers,
            totalCourses,
            totalOrders,
            totalRevenue,
        };
    }
}

