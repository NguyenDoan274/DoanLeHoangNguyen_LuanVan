import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateCourseSectionDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề chương học không được để trống' })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  order_index?: number;
}
