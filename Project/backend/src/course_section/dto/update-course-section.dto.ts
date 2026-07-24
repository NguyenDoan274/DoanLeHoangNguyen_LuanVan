import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateCourseSectionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  order_index?: number;
}
