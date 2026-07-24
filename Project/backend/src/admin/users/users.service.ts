import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(name?: string) {
    const users = await this.prisma.users.findMany({
      where: name
        ? {
            full_name: {
              contains: name,
              mode: 'insensitive', 
            },
          }
        : {},
      select: {
        id: true,
        full_name: true,
        email: true,
        avatar_url: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return {  
      data: users
    }
  }

  // 2. Hiển thị user theo id
  async findOne(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        email: true,
        avatar_url: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return user;
  }

  // 3. Thêm user mới
  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();

    // Kiểm tra trùng lặp email
    const existedUser = await this.prisma.users.findUnique({
      where: { email },
    });

    if (existedUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    // Mã hóa mật khẩu bảo mật
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user= await this.prisma.users.create({
      data: {
        id: randomUUID(),
        full_name: createUserDto.full_name,
        email,
        password_hash: passwordHash,
        role: createUserDto.role ?? 'STUDENT',
        status: createUserDto.status ?? 'ACTIVE',
        avatar_url: createUserDto.avatar_url ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
      },
    });
    return {
      message: "Thêm user thành công",
      data: user
    }
  }

  // 4. Sửa thông tin user
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id); 

    const updateData: any = {
      updated_at: new Date(),
    };

    if (updateUserDto.full_name !== undefined) updateData.full_name = updateUserDto.full_name;
    if (updateUserDto.role !== undefined) updateData.role = updateUserDto.role;
    if (updateUserDto.status !== undefined) updateData.status = updateUserDto.status;
    if (updateUserDto.avatar_url !== undefined) updateData.avatar_url = updateUserDto.avatar_url;

    // Xử lý logic đổi email (nếu có)
    if (updateUserDto.email !== undefined) {
      const email = updateUserDto.email.trim().toLowerCase();
      if (email !== user.email) {
        const existedUser = await this.prisma.users.findUnique({ where: { email } });
        if (existedUser) {
          throw new ConflictException('Email này đã được sử dụng bởi tài khoản khác');
        }
        updateData.email = email;
      }
    }

    // Xử lý đổi mật khẩu mới (nếu có)
    if (updateUserDto.password !== undefined) {
      updateData.password_hash = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        status: true,
        updated_at: true,
      },
    });
    return {
      message: "Sửa thông tin user thành công",
      data: updatedUser
    }
  }

  async softDelete(id: string) {
    await this.findOne(id);

    const deletedUser = await this.prisma.users.update({
      where: { id },
      data: {
        status: 'BANNED',
        updated_at: new Date(),
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        status: true,
        updated_at: true,
      },
    });
    
    return {
      message: "Ban user thành công"
    }
  }
}