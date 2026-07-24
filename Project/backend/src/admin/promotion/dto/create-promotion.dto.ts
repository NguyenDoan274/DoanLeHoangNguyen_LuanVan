import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class CreatePromotionDto {
  @IsNotEmpty({ message: 'Tên chương trình khuyến mãi không được để trống' })
  @IsString()
  name!: string;

  @IsNotEmpty({ message: 'Phần trăm giảm giá không được để trống' })
  @IsNumber({}, { message: 'Phần trăm giảm giá phải là số' })
  discount_percentage!: number;

  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  @IsDateString()
  start_date!: string;

  @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
  @IsDateString()
  end_date!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true, message: 'Danh sách danh mục phải gồm các UUID hợp lệ' })
  category_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true, message: 'Danh sách khóa học phải gồm các UUID hợp lệ' })
  course_ids?: string[];
}
