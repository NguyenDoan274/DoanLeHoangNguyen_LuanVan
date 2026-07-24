import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { order_status } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AdminOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const orders = await this.prisma.orders.findMany({
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        order_items: {
          include: {
            courses: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
      data: orders,
    };
  }

  async updateStatus(orderId: string, newStatus: order_status) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { order_items: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    if (order.status === newStatus) {
      return {
        message: 'Trạng thái đơn hàng không thay đổi.',
        data: order,
      };
    }

    // Process status update
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update Order Status
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          updated_at: new Date(),
        },
      });

      // 2. If transitioning to COMPLETED, update payment to SUCCESS and create enrollments
      if (newStatus === 'COMPLETED') {
        // Update or create payment
        const pendingPayment = await tx.payments.findFirst({
          where: { order_id: orderId, status: 'PENDING' },
        });

        if (pendingPayment) {
          await tx.payments.update({
            where: { id: pendingPayment.id },
            data: {
              status: 'SUCCESS',
              paid_at: new Date(),
            },
          });
        } else {
          // Check if SUCCESS payment already exists
          const existingSuccessPayment = await tx.payments.findFirst({
            where: { order_id: orderId, status: 'SUCCESS' },
          });

          if (!existingSuccessPayment) {
            await tx.payments.create({
              data: {
                id: crypto.randomUUID(),
                order_id: orderId,
                payment_method: 'ADMIN_MANUAL',
                amount: order.final_price,
                status: 'SUCCESS',
                paid_at: new Date(),
                created_at: new Date(),
              },
            });
          }
        }

        // Create or activate enrollment for each course
        for (const item of order.order_items) {
          await tx.enrollments.upsert({
            where: {
              student_id_course_id: {
                student_id: order.student_id,
                course_id: item.course_id,
              },
            },
            update: {
              status: 'ACTIVE',
              enrolled_at: new Date(),
              order_item_id: item.id,
            },
            create: {
              id: crypto.randomUUID(),
              student_id: order.student_id,
              course_id: item.course_id,
              order_item_id: item.id,
              status: 'ACTIVE',
              enrolled_at: new Date(),
            },
          });
        }
      } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED') {
        // If order failed/cancelled, we also fail/cancel payments and enrollments
        const pendingPayment = await tx.payments.findFirst({
          where: { order_id: orderId, status: 'PENDING' },
        });

        if (pendingPayment) {
          await tx.payments.update({
            where: { id: pendingPayment.id },
            data: {
              status: 'FAILED',
            },
          });
        }

        // Deactivate enrollments if they exist
        for (const item of order.order_items) {
          const enrollment = await tx.enrollments.findUnique({
            where: {
              student_id_course_id: {
                student_id: order.student_id,
                course_id: item.course_id,
              },
            },
          });

          if (enrollment) {
            await tx.enrollments.update({
              where: { id: enrollment.id },
              data: {
                status: 'CANCELLED',
              },
            });
          }
        }
      }

      return updatedOrder;
    });

    return {
      message: 'Cập nhật trạng thái đơn hàng thành công.',
      data: updated,
    };
  }
}
