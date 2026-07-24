import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCourseGroupDto {
    @IsString()
    @IsNotEmpty()
    category_id!: string;

    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsOptional()
    order_index?: number;
}