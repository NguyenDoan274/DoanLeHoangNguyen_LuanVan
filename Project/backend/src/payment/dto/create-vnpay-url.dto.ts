import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateVNPayUrlDto {
    @IsNotEmpty({ message: 'Mã đơn hàng không được để trống' })
    @IsUUID('all', { message: 'Mã đơn hàng phải là định dạng UUID' })
    order_id!: string;
}
