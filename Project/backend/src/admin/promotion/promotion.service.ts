import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePromotionDto) {
    const promotionId = randomUUID();

    const promotion = await this.prisma.$transaction(async (tx) => {
      // 1. Create promotion
      const promo = await tx.promotions.create({
        data: {
          id: promotionId,
          name: dto.name,
          discount_percentage: dto.discount_percentage,
          start_date: new Date(dto.start_date),
          end_date: new Date(dto.end_date),
          is_active: dto.is_active !== undefined ? dto.is_active : true,
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // 2. Map categories if any
      if (dto.category_ids && dto.category_ids.length > 0) {
        for (const catId of dto.category_ids) {
          await tx.promotion_categories.create({
            data: {
              promotion_id: promotionId,
              category_id: catId,
            },
          });
        }
      }

      // 3. Map courses if any
      if (dto.course_ids && dto.course_ids.length > 0) {
        for (const courseId of dto.course_ids) {
          await tx.promotion_courses.create({
            data: {
              promotion_id: promotionId,
              course_id: courseId,
            },
          });
        }
      }

      return promo;
    });

    return {
      message: 'Tạo chương trình khuyến mãi thành công.',
      data: promotion,
    };
  }

  async findAll() {
    return this.prisma.promotions.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        promotion_categories: {
          include: {
            categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        promotion_courses: {
          include: {
            courses: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        users: {
          select: {
            full_name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const promo = await this.prisma.promotions.findUnique({
      where: { id },
      include: {
        promotion_categories: {
          include: {
            categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        promotion_courses: {
          include: {
            courses: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        users: {
          select: {
            full_name: true,
          },
        },
      },
    });

    if (!promo) {
      throw new NotFoundException('Chương trình khuyến mãi không tồn tại.');
    }
    return promo;
  }

  async update(id: string, dto: UpdatePromotionDto) {
    await this.findOne(id); // Check existence

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      const promo = await tx.promotions.update({
        where: { id },
        data: {
          name: dto.name,
          discount_percentage: dto.discount_percentage,
          start_date: dto.start_date ? new Date(dto.start_date) : undefined,
          end_date: dto.end_date ? new Date(dto.end_date) : undefined,
          is_active: dto.is_active,
          updated_at: new Date(),
        },
      });

      // 2. Update categories if provided
      if (dto.category_ids !== undefined) {
        // Clear existing
        await tx.promotion_categories.deleteMany({
          where: { promotion_id: id },
        });

        // Insert new ones
        for (const catId of dto.category_ids) {
          await tx.promotion_categories.create({
            data: {
              promotion_id: id,
              category_id: catId,
            },
          });
        }
      }

      // 3. Update courses if provided
      if (dto.course_ids !== undefined) {
        // Clear existing
        await tx.promotion_courses.deleteMany({
          where: { promotion_id: id },
        });

        // Insert new ones
        for (const courseId of dto.course_ids) {
          await tx.promotion_courses.create({
            data: {
              promotion_id: id,
              course_id: courseId,
            },
          });
        }
      }

      return promo;
    });

    return {
      message: 'Cập nhật chương trình khuyến mãi thành công.',
      data: updated,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      // Clear mappings first to avoid constraint violation
      await tx.promotion_categories.deleteMany({
        where: { promotion_id: id },
      });
      await tx.promotion_courses.deleteMany({
        where: { promotion_id: id },
      });

      // Delete promotion
      await tx.promotions.delete({
        where: { id },
      });
    });

    return {
      message: 'Xóa chương trình khuyến mãi thành công.',
    };
  }
}
