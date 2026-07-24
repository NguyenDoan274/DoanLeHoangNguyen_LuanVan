import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { user_role, user_status } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password!: string;

  @IsEnum(['STUDENT', 'INSTRUCTOR', 'ADMIN'])
  @IsOptional()
  role?: user_role;

  @IsEnum(['ACTIVE', 'INACTIVE', 'BANNED'])
  @IsOptional()
  status?: user_status;

  @IsString()
  @IsOptional()
  avatar_url?: string;
}