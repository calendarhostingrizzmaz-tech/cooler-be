import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto';
import { RegisterUserDto } from '@/modules/auth/dto/registration.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @ApiOperation({ summary: 'User login' })
  @ApiOkResponse()
  @HttpCode(200)
  @Post('login')
  async login(@Body() body: AuthDto) {
    return this.authService.login(body);
  }

  @ApiOperation({ summary: 'User registration' })
  @ApiOkResponse()
  @HttpCode(201)
  @Post('register')
  register(@Body() body: RegisterUserDto) {
    return this.authService.registration(body);
  }
}
