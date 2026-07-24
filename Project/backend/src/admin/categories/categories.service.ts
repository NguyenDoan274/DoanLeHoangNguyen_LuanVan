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
    const name = createCategoryDto.name;

    const existingCategory = await this.prisma.categories.findFirst({
      where: { name: name }
    });
    
    if (existingCategory) {
      throw new BadRequestException('Danh mục đã tồn tại');
    }
    const category = await this.prisma.categories.create({
      data: {
        id: randomUUID(),
        name: name,
        description: createCategoryDto.description,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return {
      message: 'Thêm danh mục thành công',
      data: category,
    }
  }

  // Lấy danh sách tất cả danh mục
  async findAll() {
    return this.prisma.categories.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // Lấy chi tiết một danh mục
  async findOne(id: string) {
    const category = await this.prisma.categories.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    return category;
  }

  // Cập nhật thông tin danh mục
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id); // Kiểm tra tồn tại
    
    const name = updateCategoryDto.name;
    const existingCategory = await this.prisma.categories.findFirst({
      where: { name: name }
    });
    
    if (existingCategory) {
      throw new BadRequestException('Danh mục đã tồn tại');
    }
    const category = await this.prisma.categories.update({
      where: { id },
      data: {
        name: name,
        description: updateCategoryDto.description,
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

    const cate_in_course_groups = await this.prisma.course_groups.findFirst({
      where: {category_id:id}
    });
    const cate_in_courses = await this.prisma.courses.findFirst({
      where: {category_id:id}
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