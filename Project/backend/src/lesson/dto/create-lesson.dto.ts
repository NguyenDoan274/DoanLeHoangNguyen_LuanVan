import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề bài học không được để trống' })
  title!: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  order_index?: any;

  @IsOptional()
  is_preview?: any;
}
