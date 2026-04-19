import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class verifyOtpCodeDto {
  @ApiProperty({
    example: '',
    description: 'The email of the user',
  })
  @IsEmail(undefined, { message: 'email must be a valid email' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @ApiProperty({
    example: '',
    description: 'The Otp Code',
  })
  @IsNotEmpty({ message: 'otp code is required' })
  otpCode: string;
}
