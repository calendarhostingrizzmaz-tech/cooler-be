import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    description: 'The first name of the user',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty({ message: 'first name is required' })
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    type: 'string',
    format: 'string',
  })
  @IsString()
  @IsNotEmpty({ message: 'last name is required' })
  lastName: string;

  otpCode: string;

  @ApiProperty({
    description: 'The email of the user',
    type: 'string',
    format: 'string',
  })
  @IsEmail(undefined, { message: 'email must be a valid email' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @ApiProperty({
    example: 'Password@12',
    description:
      'The password of the user password should be at least 6 and max 50 characters long and contain at least one upper letter, number and a special character',
    type: 'string',
    format: 'string',
  })
  @IsString()
  @MinLength(6, { message: 'password should be at least 6 characters long' })
  @MaxLength(50, {
    message: 'password should not be longer than 50 characters',
  })
  @Matches(/((?=.*\d)(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'password too weak, password must contains one upper letter,number and a special character',
  })
  password: string;
}
