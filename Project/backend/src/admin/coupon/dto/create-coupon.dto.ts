import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateCouponDto {
  @IsNotEmpty({ message: 'Mã coupon không được để trống' })
  @IsString({ message: 'Mã coupon phải là chuỗi' })
  code!: string;

  @IsNotEmpty({ message: 'Phần trăm giảm giá không được để trống' })
  @IsNumber({}, { message: 'Phần trăm giảm giá phải là số' })
  discount_percentage!: number;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không đúng định dạng' })
  start_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không đúng định dạng' })
  end_date?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Giới hạn số lần sử dụng phải là số' })
  usage_limit?: number;

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}
