import { IsOptional, IsString } from 'class-validator';

export class UpdateLessonDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  order_index?: any;

  @IsOptional()
  is_preview?: any;
}
