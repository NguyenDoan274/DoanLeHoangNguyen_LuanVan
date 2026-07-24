import { IsOptional, IsString, IsNumber, IsEnum, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import { course_status } from "@prisma/client";

export class UpdateCourseDto {
    @IsString()
    @IsOptional()
    category_id?: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    short_description?: string;

    @IsString()
    @IsOptional()
    description?: string;

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
