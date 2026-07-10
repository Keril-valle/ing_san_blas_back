import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  password: string;
}
