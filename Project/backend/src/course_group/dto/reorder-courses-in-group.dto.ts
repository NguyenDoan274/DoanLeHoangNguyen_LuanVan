import { IsNotEmpty, IsString, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ReorderItem {
    @IsString()
    @IsNotEmpty()
    course_id!: string;

    @IsInt()
    @IsNotEmpty()
    order_index!: number;
}

export class ReorderCoursesInGroupDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderItem)
    items!: ReorderItem[];
}
