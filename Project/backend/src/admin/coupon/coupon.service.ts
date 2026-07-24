import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCouponDto) {
    // Check if code exists
    const existing = await this.prisma.coupons.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException('Mã coupon này đã tồn tại.');
    }

    const coupon = await this.prisma.coupons.create({
      data: {
        id: randomUUID(),
        code: dto.code.toUpperCase(),
        discount_percentage: dto.discount_percentage,
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        usage_limit: dto.usage_limit || null,
        used_count: 0,
        status: dto.status || 'ACTIVE',
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      message: 'Tạo mã giảm giá thành công.',
      data: coupon,
    };
  }

  async findAll() {
    return this.prisma.coupons.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: {
            full_name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupons.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            full_name: true,
          },
        },
      },
    });
    if (!coupon) {
      throw new NotFoundException('Mã giảm giá không tồn tại.');
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findOne(id); // Check existence

    if (dto.code) {
      const existing = await this.prisma.coupons.findFirst({
        where: {
          code: dto.code.toUpperCase(),
          id: { not: id },
        },
      });
      if (existing) {
        throw new BadRequestException('Mã coupon này đã tồn tại.');
      }
    }

    const updated = await this.prisma.coupons.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase() : undefined,
        discount_percentage: dto.discount_percentage,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
        usage_limit: dto.usage_limit !== undefined ? dto.usage_limit : undefined,
        status: dto.status,
        updated_at: new Date(),
      },
    });

    return {
      message: 'Cập nhật mã giảm giá thành công.',
      data: updated,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    
    // Check if used in orders
    const usedInOrder = await this.prisma.orders.findFirst({
      where: { coupon_id: id },
    });
    if (usedInOrder) {
      throw new BadRequestException('Không thể xóa mã giảm giá này vì đã được sử dụng trong các đơn hàng.');
    }

    await this.prisma.coupons.delete({
      where: { id },
    });

    return {
      message: 'Xóa mã giảm giá thành công.',
    };
  }
}
