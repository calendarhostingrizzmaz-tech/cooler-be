import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class OtpCodeDto {
  @ApiProperty({
    example: '',
    description: 'The Otp Code',
  })
  @IsNotEmpty({ message: 'otp code is required' })
  otpCode: string;
}
