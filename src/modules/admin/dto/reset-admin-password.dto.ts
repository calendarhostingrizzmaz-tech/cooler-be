import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class ResetAdminPasswordDto {
  @ApiProperty({ example: 'watercoolern@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  otp: string;

  @ApiProperty({ example: 'NewSecurePass1' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
