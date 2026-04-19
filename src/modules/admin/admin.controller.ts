import {
  Controller,
  Post,
  Body,
  Patch,
  Get,
  Request,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import { RequestAdminPasswordResetDto } from './dto/request-admin-password-reset.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Admin login' })
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginAdminDto) {
    return this.adminService.login(dto);
  }

  @ApiOperation({ summary: 'Request admin password reset (OTP emailed to recovery address)' })
  @HttpCode(200)
  @Post('forgot-password/request')
  requestPasswordReset(@Body() dto: RequestAdminPasswordResetDto) {
    return this.adminService.requestPasswordReset(dto);
  }

  @ApiOperation({ summary: 'Reset admin password with OTP from email' })
  @HttpCode(200)
  @Post('forgot-password/reset')
  resetPasswordWithOtp(@Body() dto: ResetAdminPasswordDto) {
    return this.adminService.resetPasswordWithOtp(dto);
  }

  @ApiOperation({ summary: 'Update admin credentials (triggers email)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('credentials')
  updateCredentials(@Request() req, @Body() dto: UpdateCredentialsDto) {
    return this.adminService.updateCredentials(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Get admin profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.adminService.getProfile(req.user.id);
  }
}
