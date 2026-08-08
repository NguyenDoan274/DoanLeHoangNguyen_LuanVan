import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo mới danh mục
  async create(createCategoryDto: CreateCategoryDto) {
    const { name, description, parent_id } = createCategoryDto;

    const existingCategory = await this.prisma.categories.findFirst({
      where: { name: name }
    });
    
    if (existingCategory) {
      throw new BadRequestException('Danh mục đã tồn tại');
    }

    if (parent_id) {
      const parentCategory = await this.prisma.categories.findUnique({
        where: { id: parent_id },
      });
      if (!parentCategory) {
        throw new BadRequestException('Danh mục cha không tồn tại');
      }
    }

    const category = await this.prisma.categories.create({
      data: {
        id: randomUUID(),
        name: name,
        description: description,
        parent_id: parent_id || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return {
      message: 'Thêm danh mục thành công',
      data: category,
    }
  }

  // Lấy danh sách tất cả danh mục (kèm thông tin parent và children)
  async findAll() {
    return this.prisma.categories.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // Lấy chi tiết một danh mục
  async findOne(id: string) {
    const category = await this.prisma.categories.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    return category;
  }

  // Cập nhật thông tin danh mục
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id); // Kiểm tra tồn tại
    
    const { name, description, parent_id } = updateCategoryDto;

    if (name) {
      const existingCategory = await this.prisma.categories.findFirst({
        where: { name: name }
      });
      
      if (existingCategory) {
        throw new BadRequestException('Danh mục đã tồn tại');
      }
    }

    if (parent_id !== undefined && parent_id !== null) {
      if (parent_id === id) {
        throw new BadRequestException('Danh mục không thể làm cha của chính nó');
      }
      const parentCategory = await this.prisma.categories.findUnique({
        where: { id: parent_id },
      });
      if (!parentCategory) {
        throw new BadRequestException('Danh mục cha không tồn tại');
      }
      if (parentCategory.parent_id === id) {
        throw new BadRequestException('Không thể tạo vòng lặp danh mục cha - con');
      }
    }

    const category = await this.prisma.categories.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(parent_id !== undefined && { parent_id: parent_id || null }),
        updated_at: new Date(),
      },
    });

    return {
      message: 'Cập nhật danh mục thành công',
      data: category,
    }
  }

  // Xóa danh mục
  async remove(id: string) {
    await this.findOne(id); // Kiểm tra tồn tại

    const hasChildren = await this.prisma.categories.findFirst({
      where: { parent_id: id }
    });
    if (hasChildren) {
      throw new BadRequestException(
        'Không thể xóa danh mục vì đang chứa danh mục con.',
      );
    }

    const cate_in_course_groups = await this.prisma.course_groups.findFirst({
      where: { category_id: id }
    });
    const cate_in_courses = await this.prisma.courses.findFirst({
      where: { category_id: id }
    });

    if (cate_in_course_groups != null || cate_in_courses != null) {
      throw new BadRequestException(
        'Không thể xóa danh mục vì đang được sử dụng.',
      );
    }

    await this.prisma.categories.delete({
      where: { id },
    });

    return { message: 'Xóa danh mục thành công' };
  }
}