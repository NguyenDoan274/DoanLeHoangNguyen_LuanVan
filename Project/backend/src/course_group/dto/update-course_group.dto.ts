import { IsOptional, IsString } from "class-validator";

export class UpdateCourseGroupDto {
    @IsString()
    @IsOptional()
    category_id?: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsOptional()
    order_index?: number;
}
