import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstructorService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(instructorId: string) {
    // 1. Total Enrolled Students
    const totalStudents = await this.prisma.enrollments.count({
      where: {
        courses: {
          instructor_id: instructorId,
        },
        status: 'ACTIVE',
      },
    });

    // 2. Total Courses
    const totalCourses = await this.prisma.courses.count({
      where: {
        instructor_id: instructorId,
      },
    });

    // 3. Active Courses (PUBLISHED)
    const activeCourses = await this.prisma.courses.count({
      where: {
        instructor_id: instructorId,
        status: 'PUBLISHED',
      },
    });

    // 4. Total Lessons
    const totalLessons = await this.prisma.lessons.count({
      where: {
        course_sections: {
          courses: {
            instructor_id: instructorId,
          },
        },
      },
    });

    // 5. Total Revenue from successful payments for instructor's courses
    const paidOrderItems = await this.prisma.order_items.findMany({
      where: {
        courses: {
          instructor_id: instructorId,
        },
        orders: {
          payments: {
            some: {
              status: 'SUCCESS',
            },
          },
        },
      },
      select: {
        final_price: true,
        orders: {
          select: {
            coupons: {
              select: {
                discount_percentage: true,
              },
            },
          },
        },
      },
    });

    const totalRevenue = paidOrderItems.reduce((sum, item) => {
      const itemPrice = Number(item.final_price);
      const discountPercentage = item.orders?.coupons?.discount_percentage
        ? Number(item.orders.coupons.discount_percentage)
        : 0;
      return sum + itemPrice * (1 - discountPercentage / 100);
    }, 0);

    // 6. Course-by-course statistics
    const courses = await this.prisma.courses.findMany({
      where: {
        instructor_id: instructorId,
      },
      include: {
        enrollments: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
          },
        },
        order_items: {
          where: {
            orders: {
              payments: {
                some: {
                  status: 'SUCCESS',
                },
              },
            },
          },
          select: {
            final_price: true,
            orders: {
              select: {
                coupons: {
                  select: {
                    discount_percentage: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const courseStats = courses.map((course) => {
      const studentCount = course.enrollments.length;
      const revenue = course.order_items.reduce((sum, item) => {
        const itemPrice = Number(item.final_price);
        const discountPercentage = item.orders?.coupons?.discount_percentage
          ? Number(item.orders.coupons.discount_percentage)
          : 0;
        return sum + itemPrice * (1 - discountPercentage / 100);
      }, 0);
      return {
        id: course.id,
        title: course.title,
        status: course.status,
        price: Number(course.price),
        studentCount,
        revenue,
      };
    });

    // 7. Recent Enrollments (latest 5)
    const recentEnrollments = await this.prisma.enrollments.findMany({
      where: {
        courses: {
          instructor_id: instructorId,
        },
        status: 'ACTIVE',    
      },
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
            avatar_url: true,
          },
        },
        courses: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        enrolled_at: 'desc',
      },
      take: 5,
    });

    return {
      totalStudents,
      totalCourses,
      activeCourses,
      totalLessons,
      totalRevenue,
      courseStats,
      recentEnrollments,
    };
  }
}
