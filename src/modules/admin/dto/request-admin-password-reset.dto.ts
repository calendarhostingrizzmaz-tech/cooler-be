import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestAdminPasswordResetDto {
  @ApiProperty({ example: 'watercoolern@gmail.com', description: 'Admin panel login email' })
  @IsEmail()
  email: string;
}
