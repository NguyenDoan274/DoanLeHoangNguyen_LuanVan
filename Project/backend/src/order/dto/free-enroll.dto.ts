import { IsNotEmpty, IsUUID } from "class-validator";

export class FreeEnrollDto {
    @IsNotEmpty({ message: 'Mã khóa học không được để trống' })
    @IsUUID('all', { message: 'Mã khóa học phải là định dạng UUID' })
    course_id!: string;
}
