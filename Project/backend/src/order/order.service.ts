import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FreeEnrollDto } from './dto/free-enroll.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import * as crypto from 'crypto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async freeEnroll(userId: string, dto: FreeEnrollDto) {
    const { course_id } = dto;

    const course = await this.prisma.courses.findUnique({
      where: { id: course_id },
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học.');
    }

    const price = parseFloat(course.price.toString());
    if (price !== 0) {
      throw new BadRequestException('Khóa học này không miễn phí. Hãy đăng ký qua trang thanh toán.');
    }

    // Check existing enrollment
    const existing = await this.prisma.enrollments.findUnique({
      where: {
        student_id_course_id: {
          student_id: userId,
          course_id: course_id,
        },
      },
    });

    if (existing && existing.status === 'ACTIVE') {
      throw new BadRequestException('Bạn đã đăng ký khóa học này rồi.');
    }

    // Upsert to ACTIVE
    const enrollment = await this.prisma.enrollments.upsert({
      where: {
        student_id_course_id: {
          student_id: userId,
          course_id: course_id,
        },
      },
      update: {
        status: 'ACTIVE',
        enrolled_at: new Date(),
        order_item_id: null,
      },
      create: {
        id: crypto.randomUUID(),
        student_id: userId,
        course_id: course_id,
        status: 'ACTIVE',
        enrolled_at: new Date(),
        order_item_id: null,
      },
    });

    return {
      message: 'Đăng ký khóa học miễn phí thành công.',
      data: enrollment,
    };
  }

  async getAppliedPromotion(courseId: string, categoryId: string) {
    const now = new Date();
    const promotions = await this.prisma.promotions.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
        OR: [
          {
            promotion_courses: {
              some: { course_id: courseId }
            }
          },
          {
            promotion_categories: {
              some: { category_id: categoryId }
            }
          }
        ]
      }
    });

    if (promotions.length === 0) return null;
    
    // Find promotion with max discount percentage
    let maxPromo = promotions[0];
    for (const promo of promotions) {
      if (Number(promo.discount_percentage) > Number(maxPromo.discount_percentage)) {
        maxPromo = promo;
      }
    }
    return maxPromo;
  }

  async getValidatedCoupon(code: string) {
    const coupon = await this.prisma.coupons.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Mã giảm giá không tồn tại.');
    }

    if (coupon.status !== 'ACTIVE') {
      throw new BadRequestException('Mã giảm giá không còn hiệu lực.');
    }

    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      throw new BadRequestException('Chương trình giảm giá chưa bắt đầu.');
    }

    if (coupon.end_date && new Date(coupon.end_date) < now) {
      throw new BadRequestException('Mã giảm giá đã hết hạn.');
    }

    if (coupon.usage_limit !== null && (coupon.used_count ?? 0) >= coupon.usage_limit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng.');
    }

    return coupon;
  }

  async validateCoupon(code: string) {
    const coupon = await this.getValidatedCoupon(code);
    return {
      message: 'Mã giảm giá hợp lệ.',
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_percentage: Number(coupon.discount_percentage),
      },
    };
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const { course_id, coupon_code } = dto;

    const course = await this.prisma.courses.findUnique({
      where: { id: course_id },
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học.');
    }

    const price = parseFloat(course.price.toString());
    if (price <= 0) {
      throw new BadRequestException('Khóa học này miễn phí. Hãy đăng ký trực tiếp.');
    }

    // Check existing active enrollment
    const existingEnrollment = await this.prisma.enrollments.findUnique({
      where: {
        student_id_course_id: {
          student_id: userId,
          course_id: course_id,
        },
      },
    });

    if (existingEnrollment && existingEnrollment.status === 'ACTIVE') {
      throw new BadRequestException('Bạn đã đăng ký khóa học này rồi.');
    }

    // Check if there is an existing PENDING order for this course, mark as FAILED if exists
    const existingOrder = await this.prisma.orders.findFirst({
      where: {
        student_id: userId,
        status: 'PENDING',
        order_items: {
          some: {
            course_id: course_id,
          },
        },
      },
    });

    if (existingOrder) {
      await this.prisma.$transaction(async (tx) => {
        await tx.payments.updateMany({
          where: {
            order_id: existingOrder.id,
            status: 'PENDING',
          },
          data: {
            status: 'FAILED',
          },
        });

        await tx.orders.update({
          where: {
            id: existingOrder.id,
          },
          data: {
            status: 'FAILED',
            updated_at: new Date(),
          },
        });
      });
    }

    // 1. Calculate active promotion
    const appliedPromo = await this.getAppliedPromotion(course.id, course.category_id);
    let promoDiscount = 0;
    let promoId: string | null = null;
    let itemFinalPrice = price;

    if (appliedPromo) {
      const promoPercentage = Number(appliedPromo.discount_percentage);
      promoDiscount = price * (promoPercentage / 100);
      itemFinalPrice = price - promoDiscount;
      promoId = appliedPromo.id;
    }

    // 2. Calculate coupon discount if provided
    let couponDiscount = 0;
    let couponId: string | null = null;
    let finalOrderPrice = itemFinalPrice;

    if (coupon_code) {
      const coupon = await this.getValidatedCoupon(coupon_code);
      const couponPercentage = Number(coupon.discount_percentage);
      couponDiscount = itemFinalPrice * (couponPercentage / 100);
      finalOrderPrice = itemFinalPrice - couponDiscount;
      couponId = coupon.id;
    }

    const orderId = crypto.randomUUID();
    const orderItemId = crypto.randomUUID();

    // Create order inside a transaction
    const newOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.orders.create({
        data: {
          id: orderId,
          student_id: userId,
          coupon_id: couponId,
          base_price: price,
          promotion_discount: promoDiscount,
          coupon_discount: couponDiscount,
          final_price: finalOrderPrice,
          status: 'PENDING',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      await tx.order_items.create({
        data: {
          id: orderItemId,
          order_id: orderId,
          course_id: course_id,
          base_price: price,
          promotion_id: promoId,
          promotion_discount: promoDiscount,
          final_price: itemFinalPrice,
        },
      });

      return order;
    });

    return {
      message: 'Tạo đơn hàng thành công.',
      data: newOrder,
    };
  }

  async createGroupOrder(userId: string, dto: CreateGroupOrderDto) {
    const { course_group_id, coupon_code } = dto;

    const courseGroup = await this.prisma.course_groups.findUnique({
      where: { id: course_group_id },
      include: {
        course_group_items: {
          include: {
            courses: true,
          },
        },
      },
    });

    if (!courseGroup) {
      throw new NotFoundException('Không tìm thấy lộ trình học.');
    }

    // Get user active enrollments to filter out
    const enrolledCourses = await this.prisma.enrollments.findMany({
      where: {
        student_id: userId,
        status: 'ACTIVE',
      },
      select: { course_id: true },
    });
    const enrolledIds = enrolledCourses.map((e) => e.course_id);

    // Get courses in group that the user has not enrolled in
    const coursesToOrder = courseGroup.course_group_items
      .map((item) => item.courses)
      .filter((course) => !enrolledIds.includes(course.id));

    if (coursesToOrder.length === 0) {
      throw new BadRequestException('Bạn đã đăng ký toàn bộ khóa học trong lộ trình này rồi.');
    }

    // Check if there is an existing PENDING order for this group, mark as FAILED if exists
    const existingGroupOrder = await this.prisma.orders.findFirst({
      where: {
        student_id: userId,
        status: 'PENDING',
        order_items: {
          some: {
            course_id: { in: coursesToOrder.map((c) => c.id) },
          },
        },
      },
    });

    if (existingGroupOrder) {
      await this.prisma.$transaction(async (tx) => {
        await tx.payments.updateMany({
          where: {
            order_id: existingGroupOrder.id,
            status: 'PENDING',
          },
          data: {
            status: 'FAILED',
          },
        });

        await tx.orders.update({
          where: {
            id: existingGroupOrder.id,
          },
          data: {
            status: 'FAILED',
            updated_at: new Date(),
          },
        });
      });
    }

    // Calculate applied promotions and order items details
    let totalBasePrice = 0;
    let totalPromoDiscount = 0;
    const orderItemsData: any[] = [];

    for (const course of coursesToOrder) {
      const price = parseFloat(course.price.toString());
      totalBasePrice += price;

      const appliedPromo = await this.getAppliedPromotion(course.id, course.category_id);
      let promoDiscount = 0;
      let promoId: string | null = null;
      let itemFinalPrice = price;

      if (appliedPromo) {
        const promoPercentage = Number(appliedPromo.discount_percentage);
        promoDiscount = price * (promoPercentage / 100);
        itemFinalPrice = price - promoDiscount;
        promoId = appliedPromo.id;
      }

      totalPromoDiscount += promoDiscount;

      orderItemsData.push({
        id: crypto.randomUUID(),
        course_id: course.id,
        base_price: price,
        promotion_id: promoId,
        promotion_discount: promoDiscount,
        final_price: itemFinalPrice,
      });
    }

    // Calculate coupon discount
    const priceAfterPromo = totalBasePrice - totalPromoDiscount;
    let couponDiscount = 0;
    let couponId: string | null = null;
    let finalOrderPrice = priceAfterPromo;

    if (coupon_code) {
      const coupon = await this.getValidatedCoupon(coupon_code);
      const couponPercentage = Number(coupon.discount_percentage);
      couponDiscount = priceAfterPromo * (couponPercentage / 100);
      finalOrderPrice = priceAfterPromo - couponDiscount;
      couponId = coupon.id;
    }

    const orderId = crypto.randomUUID();

    // Create order and order items inside a transaction
    const newOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.orders.create({
        data: {
          id: orderId,
          student_id: userId,
          coupon_id: couponId,
          base_price: totalBasePrice,
          promotion_discount: totalPromoDiscount,
          coupon_discount: couponDiscount,
          final_price: finalOrderPrice,
          status: 'PENDING',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      for (const item of orderItemsData) {
        await tx.order_items.create({
          data: {
            id: item.id,
            order_id: orderId,
            course_id: item.course_id,
            base_price: item.base_price,
            promotion_id: item.promotion_id,
            promotion_discount: item.promotion_discount,
            final_price: item.final_price,
          },
        });
      }

      return order;
    });

    return {
      message: 'Tạo đơn hàng lộ trình học thành công.',
      data: newOrder,
    };
  }

  async freeEnrollGroup(userId: string, dto: CreateGroupOrderDto) {
    const { course_group_id } = dto;

    const courseGroup = await this.prisma.course_groups.findUnique({
      where: { id: course_group_id },
      include: {
        course_group_items: {
          include: {
            courses: true,
          },
        },
      },
    });

    if (!courseGroup) {
      throw new NotFoundException('Không tìm thấy lộ trình học.');
    }

    // Find courses to enroll
    const enrolledCourses = await this.prisma.enrollments.findMany({
      where: {
        student_id: userId,
        status: 'ACTIVE',
      },
      select: { course_id: true },
    });
    const enrolledIds = enrolledCourses.map((e) => e.course_id);

    const coursesToEnroll = courseGroup.course_group_items
      .map((item) => item.courses)
      .filter((course) => !enrolledIds.includes(course.id));

    if (coursesToEnroll.length === 0) {
      throw new BadRequestException('Bạn đã đăng ký toàn bộ khóa học trong lộ trình này rồi.');
    }

    // Verify all of them are free
    const isAllFree = coursesToEnroll.every(c => parseFloat(c.price.toString()) === 0);
    if (!isAllFree) {
      throw new BadRequestException('Lộ trình học này có chứa khóa học trả phí. Vui lòng thanh toán.');
    }

    // Enroll inside a transaction
    await this.prisma.$transaction(async (tx) => {
      const orderId = crypto.randomUUID();
      // Create a completed order for tracking
      await tx.orders.create({
        data: {
          id: orderId,
          student_id: userId,
          base_price: 0,
          final_price: 0,
          status: 'COMPLETED',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      for (const course of coursesToEnroll) {
        const orderItemId = crypto.randomUUID();
        await tx.order_items.create({
          data: {
            id: orderItemId,
            order_id: orderId,
            course_id: course.id,
            base_price: 0,
            final_price: 0,
          },
        });

        await tx.enrollments.create({
          data: {
            id: crypto.randomUUID(),
            student_id: userId,
            course_id: course.id,
            order_item_id: orderItemId,
            status: 'ACTIVE',
            enrolled_at: new Date(),
          },
        });
      }
    });

    return {
      message: 'Đăng ký lộ trình học miễn phí thành công.',
    };
  }

  async getMyOrders(userId: string) {
    const orders = await this.prisma.orders.findMany({
      where: {
        student_id: userId,
        status: { in: ['COMPLETED', 'PENDING', 'CANCELLED'] },
      },
      include: {
        order_items: {
          include: {
            courses: {
              select: {
                id: true,
                title: true,
                thumbnail_url: true,
                price: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            payment_method: true,
            paid_at: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
      message: 'Lấy danh sách đơn hàng thành công.',
      data: orders,
    };
  }

  async getOrderDetails(userId: string, orderId: string) {
    const order = await this.prisma.orders.findFirst({
      where: {
        id: orderId,
        student_id: userId,
      },
      include: {
        order_items: {
          include: {
            courses: {
              select: {
                id: true,
                title: true,
                thumbnail_url: true,
                price: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            payment_method: true,
            paid_at: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    return {
      message: 'Lấy chi tiết đơn hàng thành công.',
      data: order,
    };
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!order || order.student_id !== userId) {
      throw new NotFoundException('Không tìm thấy đơn hàng của bạn.');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể hủy đơn hàng đang ở trạng thái chờ thanh toán.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update Order Status to CANCELLED
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updated_at: new Date(),
        },
      });

      // 2. Update pending payments to FAILED
      await tx.payments.updateMany({
        where: {
          order_id: orderId,
          status: 'PENDING',
        },
        data: {
          status: 'FAILED',
        },
      });

      return updatedOrder;
    });

    return {
      message: 'Hủy đơn hàng thành công.',
      data: updated,
    };
  }
}
