import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminEnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    student_id?: string;
    course_id?: string;
    instructor_id?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters.student_id) {
      where.student_id = filters.student_id;
    }
    if (filters.course_id) {
      where.course_id = filters.course_id;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.instructor_id) {
      where.courses = {
        instructor_id: filters.instructor_id,
      };
    }

    const enrollments = await this.prisma.enrollments.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        courses: {
          select: {
            id: true,
            title: true,
            instructor_id: true,
            users: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        order_items: {
          select: {
            id: true,
            order_id: true,
            base_price: true,
            final_price: true,
            orders: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolled_at: 'desc',
      },
    });

    // Attach payment status from order's payments
    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        let paymentStatus: string | null = null;
        if (enrollment.order_items?.orders?.id) {
          const payment = await this.prisma.payments.findFirst({
            where: { order_id: enrollment.order_items.orders.id },
            orderBy: { created_at: 'desc' },
            select: { status: true },
          });
          paymentStatus = payment?.status || null;
        }
        return {
          ...enrollment,
          payment_status: paymentStatus,
        };
      }),
    );

    return { data: result };
  }

  async activate(enrollmentId: string) {
    const enrollment = await this.prisma.enrollments.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Không tìm thấy ghi danh.');
    }

    if (enrollment.status === 'ACTIVE') {
      throw new BadRequestException('Ghi danh này đã ở trạng thái ACTIVE.');
    }

    const updated = await this.prisma.enrollments.update({
      where: { id: enrollmentId },
      data: {
        status: 'ACTIVE',
        enrolled_at: new Date(),
      },
    });

    return {
      message: 'Đã kích hoạt ghi danh thành công.',
      data: updated,
    };
  }

  async cancel(enrollmentId: string) {
    const enrollment = await this.prisma.enrollments.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Không tìm thấy ghi danh.');
    }

    if (enrollment.status === 'CANCELLED') {
      throw new BadRequestException('Ghi danh này đã bị hủy rồi.');
    }

    const updated = await this.prisma.enrollments.update({
      where: { id: enrollmentId },
      data: {
        status: 'CANCELLED',
      },
    });

    return {
      message: 'Đã hủy ghi danh thành công.',
      data: updated,
    };
  }

  async getOrder(enrollmentId: string) {
    const enrollment = await this.prisma.enrollments.findUnique({
      where: { id: enrollmentId },
      include: {
        order_items: {
          include: {
            orders: {
              include: {
                users: {
                  select: { id: true, full_name: true, email: true },
                },
                order_items: {
                  include: {
                    courses: {
                      select: { id: true, title: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Không tìm thấy ghi danh.');
    }

    if (!enrollment.order_items?.orders) {
      return { data: null, message: 'Ghi danh này không có đơn hàng liên kết (có thể là khóa học miễn phí).' };
    }

    return { data: enrollment.order_items.orders };
  }

  async getPayment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollments.findUnique({
      where: { id: enrollmentId },
      include: {
        order_items: {
          select: { order_id: true },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Không tìm thấy ghi danh.');
    }

    if (!enrollment.order_items?.order_id) {
      return { data: null, message: 'Ghi danh này không có thanh toán liên kết.' };
    }

    const payments = await this.prisma.payments.findMany({
      where: { order_id: enrollment.order_items.order_id },
      orderBy: { created_at: 'desc' },
    });

    return { data: payments };
  }
}
