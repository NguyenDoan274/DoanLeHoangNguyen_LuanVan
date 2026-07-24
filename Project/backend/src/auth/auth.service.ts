import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();

    const existedUser = await this.prisma.users.findUnique({
      where: { email },
    });

    if (existedUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        full_name: registerDto.full_name,
        email,
        password_hash: passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        avatar_url: true,
        role: true,
        status: true,
        created_at: true,
      },
    });

    return {
      message: 'Đăng ký thành công',
      user
    };
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('Tài khoản đã bị tạm ngưng');
    }
    
    if(user.status === "BANNED") {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không đúng');
    }

    const accessToken = await this.signToken(user);

    return {
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
      },
      access_token: accessToken,
    };
  }

  private async signToken(user: {
    id: string;
    email: string;
    role: string;
  }) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}