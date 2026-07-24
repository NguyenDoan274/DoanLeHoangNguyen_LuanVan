import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const payments = await this.prisma.payments.findMany({
      include: {
        orders: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                email: true,
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
      data: payments,
    };
  }

  async getStats() {
    // 1. Total revenue (SUCCESS payments)
    const successPayments = await this.prisma.payments.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true },
    });
    const totalRevenue = successPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // 2. Count by status
    const totalSuccess = await this.prisma.payments.count({ where: { status: 'SUCCESS' } });
    const totalPending = await this.prisma.payments.count({ where: { status: 'PENDING' } });
    const totalFailed = await this.prisma.payments.count({ where: { status: 'FAILED' } });

    // 3. Revenue by payment method
    const paymentsByMethod = await this.prisma.payments.groupBy({
      by: ['payment_method'],
      where: { status: 'SUCCESS' },
      _sum: {
        amount: true,
      },
    });

    const methodStats = paymentsByMethod.map((item) => ({
      method: item.payment_method,
      revenue: Number(item._sum.amount || 0),
    }));

    return {
      data: {
        totalRevenue,
        totalSuccess,
        totalPending,
        totalFailed,
        methodStats,
      },
    };
  }
}
