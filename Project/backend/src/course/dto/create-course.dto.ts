import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { course_status } from "@prisma/client";

export class CreateCourseDto {
    @IsNotEmpty({ message: 'Danh mục không được để trống' })
    category_id!: string;

    @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
    title!: string;

    @IsString()
    @IsOptional()
    short_description?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsOptional()
    thumbnail_url?: string;

    @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    @IsOptional()
    level?: string;

    @IsEnum(['DRAFT', 'PUBLISHED','HIDDEN'])
    @IsOptional()
    status?:course_status;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    price?: number;
}
