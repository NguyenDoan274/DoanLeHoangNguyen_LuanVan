import { IsNotEmpty, IsUUID, IsOptional, IsString } from "class-validator";

export class CreateGroupOrderDto {
    @IsNotEmpty({ message: 'Mã lộ trình không được để trống' })
    @IsUUID('all', { message: 'Mã lộ trình phải là định dạng UUID' })
    course_group_id!: string;

    @IsOptional()
    @IsString()
    coupon_code?: string;
}
