import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RegisterDto  {
    @IsString()
    @IsNotEmpty()
    full_name!: string

    @IsEmail()
    @IsNotEmpty()
    email!: string
    @IsString()
    @IsNotEmpty()
    password!: string
}