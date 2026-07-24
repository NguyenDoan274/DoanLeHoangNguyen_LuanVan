import { IsNotEmpty, IsUUID, IsOptional, IsString } from "class-validator";

export class CreateOrderDto {
    @IsNotEmpty({ message: 'Mã khóa học không được để trống' })
    @IsUUID('all', { message: 'Mã khóa học phải là định dạng UUID' })
    course_id!: string;

    @IsOptional()
    @IsString()
    coupon_code?: string;
}
