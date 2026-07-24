import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ProfileService {
  private readonly avatarUploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    constructor(private readonly prisma: PrismaService) {
      if (!fs.existsSync(this.avatarUploadDir)) {
        fs.mkdirSync(this.avatarUploadDir, { recursive: true });
      }
    }
    
    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
      const { current_password, new_password } = changePasswordDto;

      if (current_password === new_password) {
        throw new BadRequestException(
          'Mật khẩu mới không được trùng với mật khẩu hiện tại',
        );
      }

      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại');
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        current_password,
        user.password_hash,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
      }

      const newPasswordHash = await bcrypt.hash(new_password, 10);

      await this.prisma.users.update({
        where: { id: userId },
        data: {
          password_hash: newPasswordHash,
          updated_at: new Date(),
        },
      });

      return {
        message: 'Cập nhật mật khẩu thành công',
      };
    }
  async getProfile(userId: string) {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
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

      return {
        data: user
      };
    }

  // Cập nhật thông tin profile (full_name, avatar file upload)
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto, avatar ?: Express.Multer.File) {
      const currentUser = await this.prisma.users.findUnique({
        where: { id: userId },
      });

      if (!currentUser) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      const updateData: any = {
        updated_at: new Date(),
      };

      if (updateProfileDto.full_name !== undefined) {
        updateData.full_name = updateProfileDto.full_name;
      }

      if (avatar) {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(avatar.mimetype)) {
          throw new BadRequestException('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)');
        }

        const maxSize = 5 * 1024 * 1024;
        if (avatar.size > maxSize) {
          throw new BadRequestException('Kích thước file không được vượt quá 5MB');
        }

        if (currentUser.avatar_url) {
          const oldAvatarPath = path.join(process.cwd(), currentUser.avatar_url);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }

        // Tạo tên file mới với UUID để tránh trùng lặp
        const fileExtension = path.extname(avatar.originalname);
        const fileName = `${currentUser.full_name.split(' ').join('_')}${fileExtension}`;
        const filePath = path.join(this.avatarUploadDir, fileName);

        // Lưu file vào thư mục uploads/avatars
        fs.writeFileSync(filePath, avatar.buffer);

        // Lưu đường dẫn tương đối vào database
        updateData.avatar_url = `/uploads/avatars/${fileName}`;
      }

      const profile = await this.prisma.users.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          full_name: true,
          email: true,
          avatar_url: true,
          role: true,
          status: true,
          updated_at: true,
        },
      });
      return {
        message: 'Cập nhật thông tin profile thành công',
        profile,
      };
    }

  }
