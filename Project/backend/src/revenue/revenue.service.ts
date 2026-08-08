import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { INSTRUCTOR_REVENUE_RATE, PLATFORM_FEE_RATE } from './revenue.constants';

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build date range for a given month/year.
   * If month/year not provided, returns undefined (no date filter).
   */
  private buildDateRange(month?: number, year?: number) {
    if (!month || !year) return undefined;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    return { startDate, endDate };
  }

  /**
   * Get all successful order_items with course & instructor info,
   * filtered by optional date range and optional instructorId.
   */
  private async getSuccessfulOrderItems(options?: {
    instructorId?: string;
    month?: number;
    year?: number;
  }) {
    const dateRange = this.buildDateRange(options?.month, options?.year);

    const paymentDateFilter = dateRange
      ? { paid_at: { gte: dateRange.startDate, lt: dateRange.endDate } }
      : {};

    const instructorFilter = options?.instructorId
      ? { courses: { instructor_id: options.instructorId } }
      : {};

    const items = await this.prisma.order_items.findMany({
      where: {
        ...instructorFilter,
        orders: {
          payments: {
            some: {
              status: 'SUCCESS',
              ...paymentDateFilter,
            },
          },
        },
      },
      select: {
        id: true,
        final_price: true,
        course_id: true,
        order_id: true,
        courses: {
          select: {
            id: true,
            title: true,
            instructor_id: true,
            thumbnail_url: true,
            users: {
              select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
        orders: {
          select: {
            id: true,
            final_price: true,
            order_items: {
              select: {
                final_price: true,
              },
            },
            payments: {
              where: {
                status: 'SUCCESS',
                ...paymentDateFilter,
              },
              select: {
                amount: true,
              },
            },
          },
        },
      },
    });

    return items;
  }

  /**
   * Calculate the actual revenue attributed to a single order_item.
   * Since coupon discount is applied at order level, we proportionally
   * distribute the payment amount based on each item's final_price weight.
   */
  private calculateItemRevenue(item: {
    final_price: any;
    orders: {
      final_price: any;
      order_items: { final_price: any }[];
      payments: { amount: any }[];
    };
  }): number {
    const paymentTotal = item.orders.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    if (paymentTotal === 0) return 0;

    const orderItemsTotal = item.orders.order_items.reduce(
      (sum, oi) => sum + Number(oi.final_price),
      0,
    );

    if (orderItemsTotal === 0) return 0;

    const itemFinalPrice = Number(item.final_price);
    const ratio = itemFinalPrice / orderItemsTotal;
    const revenue = ratio * paymentTotal;

    return isNaN(revenue) ? 0 : revenue;
  }

  // ─────────────────────────────────────────────
  // ADMIN APIs
  // ─────────────────────────────────────────────

  /**
   * Admin: Get overall revenue summary
   */
  async getAdminSummary(month?: number, year?: number) {
    const items = await this.getSuccessfulOrderItems({ month, year });

    let totalRevenue = 0;
    const processedOrders = new Set<string>();
    let totalTransactions = 0;

    for (const item of items) {
      totalRevenue += this.calculateItemRevenue(item);

      // Count unique orders as transactions
      if (!processedOrders.has(item.order_id)) {
        processedOrders.add(item.order_id);
        totalTransactions++;
      }
    }

    return {
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        instructorRevenue: Math.round(totalRevenue * INSTRUCTOR_REVENUE_RATE * 100) / 100,
        platformFee: Math.round(totalRevenue * PLATFORM_FEE_RATE * 100) / 100,
        totalTransactions,
        instructorRate: INSTRUCTOR_REVENUE_RATE,
        platformRate: PLATFORM_FEE_RATE,
      },
    };
  }

  /**
   * Admin: Get revenue grouped by instructor for a given month/year
   */
  async getAdminMonthlyByInstructors(
    month: number,
    year: number,
    search?: string,
  ) {
    const items = await this.getSuccessfulOrderItems({ month, year });

    // Group by instructor
    const instructorMap = new Map<
      string,
      {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
        totalRevenue: number;
        transactionOrderIds: Set<string>;
      }
    >();

    for (const item of items) {
      const instructor = item.courses.users;
      const instructorId = instructor.id;

      if (!instructorMap.has(instructorId)) {
        instructorMap.set(instructorId, {
          id: instructor.id,
          full_name: instructor.full_name,
          email: instructor.email,
          avatar_url: instructor.avatar_url,
          totalRevenue: 0,
          transactionOrderIds: new Set<string>(),
        });
      }

      const entry = instructorMap.get(instructorId)!;
      entry.totalRevenue += this.calculateItemRevenue(item);
      entry.transactionOrderIds.add(item.order_id);
    }

    // Convert to array and apply search filter
    let instructors = Array.from(instructorMap.values()).map((entry) => ({
      id: entry.id,
      full_name: entry.full_name,
      email: entry.email,
      avatar_url: entry.avatar_url,
      totalRevenue: Math.round(entry.totalRevenue * 100) / 100,
      instructorRevenue:
        Math.round(entry.totalRevenue * INSTRUCTOR_REVENUE_RATE * 100) / 100,
      platformFee:
        Math.round(entry.totalRevenue * PLATFORM_FEE_RATE * 100) / 100,
      totalTransactions: entry.transactionOrderIds.size,
    }));

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      instructors = instructors.filter(
        (i) =>
          i.full_name.toLowerCase().includes(searchLower) ||
          i.email.toLowerCase().includes(searchLower),
      );
    }

    // Sort by revenue descending
    instructors.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      data: instructors,
    };
  }

  /**
   * Admin: Get detailed revenue for a specific instructor
   */
  async getAdminInstructorDetail(
    instructorId: string,
    month?: number,
    year?: number,
  ) {
    // Get instructor info
    const instructor = await this.prisma.users.findUnique({
      where: { id: instructorId },
      select: {
        id: true,
        full_name: true,
        email: true,
        avatar_url: true,
      },
    });

    if (!instructor) {
      return { data: null };
    }

    const items = await this.getSuccessfulOrderItems({
      instructorId,
      month,
      year,
    });

    // Group by course
    const courseMap = new Map<
      string,
      {
        id: string;
        title: string;
        thumbnail_url: string | null;
        totalRevenue: number;
        purchaseCount: number;
        orderIds: Set<string>;
      }
    >();

    let totalRevenue = 0;
    const processedOrders = new Set<string>();

    for (const item of items) {
      const courseId = item.courses.id;
      const itemRevenue = this.calculateItemRevenue(item);
      totalRevenue += itemRevenue;

      if (!processedOrders.has(item.order_id)) {
        processedOrders.add(item.order_id);
      }

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          id: item.courses.id,
          title: item.courses.title,
          thumbnail_url: item.courses.thumbnail_url,
          totalRevenue: 0,
          purchaseCount: 0,
          orderIds: new Set<string>(),
        });
      }

      const courseEntry = courseMap.get(courseId)!;
      courseEntry.totalRevenue += itemRevenue;
      courseEntry.purchaseCount += 1;
      courseEntry.orderIds.add(item.order_id);
    }

    const courses = Array.from(courseMap.values())
      .map((c) => ({
        id: c.id,
        title: c.title,
        thumbnail_url: c.thumbnail_url,
        totalRevenue: Math.round(c.totalRevenue * 100) / 100,
        instructorRevenue:
          Math.round(c.totalRevenue * INSTRUCTOR_REVENUE_RATE * 100) / 100,
        platformFee:
          Math.round(c.totalRevenue * PLATFORM_FEE_RATE * 100) / 100,
        purchaseCount: c.purchaseCount,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      data: {
        instructor,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        instructorRevenue:
          Math.round(totalRevenue * INSTRUCTOR_REVENUE_RATE * 100) / 100,
        platformFee:
          Math.round(totalRevenue * PLATFORM_FEE_RATE * 100) / 100,
        totalTransactions: processedOrders.size,
        courses,
      },
    };
  }

  // ─────────────────────────────────────────────
  // INSTRUCTOR APIs
  // ─────────────────────────────────────────────

  /**
   * Instructor: Get own revenue summary
   */
  async getInstructorSummary(instructorId: string, month?: number, year?: number) {
    const items = await this.getSuccessfulOrderItems({
      instructorId,
      month,
      year,
    });

    let totalRevenue = 0;
    const processedOrders = new Set<string>();

    for (const item of items) {
      totalRevenue += this.calculateItemRevenue(item);
      if (!processedOrders.has(item.order_id)) {
        processedOrders.add(item.order_id);
      }
    }

    return {
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        instructorRevenue:
          Math.round(totalRevenue * INSTRUCTOR_REVENUE_RATE * 100) / 100,
        platformFee:
          Math.round(totalRevenue * PLATFORM_FEE_RATE * 100) / 100,
        totalTransactions: processedOrders.size,
        instructorRate: INSTRUCTOR_REVENUE_RATE,
        platformRate: PLATFORM_FEE_RATE,
      },
    };
  }

  /**
   * Instructor: Get revenue breakdown by courses
   */
  async getInstructorMonthlyCourses(
    instructorId: string,
    month: number,
    year: number,
  ) {
    const items = await this.getSuccessfulOrderItems({
      instructorId,
      month,
      year,
    });

    // Group by course
    const courseMap = new Map<
      string,
      {
        id: string;
        title: string;
        thumbnail_url: string | null;
        totalRevenue: number;
        purchaseCount: number;
      }
    >();

    for (const item of items) {
      const courseId = item.courses.id;
      const itemRevenue = this.calculateItemRevenue(item);

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          id: item.courses.id,
          title: item.courses.title,
          thumbnail_url: item.courses.thumbnail_url,
          totalRevenue: 0,
          purchaseCount: 0,
        });
      }

      const courseEntry = courseMap.get(courseId)!;
      courseEntry.totalRevenue += itemRevenue;
      courseEntry.purchaseCount += 1;
    }

    const courses = Array.from(courseMap.values())
      .map((c) => ({
        id: c.id,
        title: c.title,
        thumbnail_url: c.thumbnail_url,
        totalRevenue: Math.round(c.totalRevenue * 100) / 100,
        instructorRevenue:
          Math.round(c.totalRevenue * INSTRUCTOR_REVENUE_RATE * 100) / 100,
        platformFee:
          Math.round(c.totalRevenue * PLATFORM_FEE_RATE * 100) / 100,
        purchaseCount: c.purchaseCount,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      data: courses,
    };
  }
}
