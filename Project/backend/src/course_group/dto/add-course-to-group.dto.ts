import { IsNotEmpty, IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class AddCourseToGroupDto {
    @IsString()
    @IsNotEmpty({ message: 'course_id không được để trống' })
    course_id!: string;

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    order_index?: number;

    @IsBoolean()
    @IsOptional()
    is_required?: boolean;
}
