import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import { RequestAdminPasswordResetDto } from './dto/request-admin-password-reset.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { Helper } from '../../utils/helper';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  /** Default admin login (new DB + legacy migration from admin@cooler.com). */
  private readonly primaryAdminEmail = 'watercoolern@gmail.com';
  private readonly primaryAdminInitialPassword = 'CoolerAdmin@2026';

  constructor(
    @InjectRepository(Admin) private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAdmin();
  }

  private async findAdminByEmailCaseInsensitive(raw: string): Promise<Admin | null> {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return this.adminRepository
      .createQueryBuilder('a')
      .where('LOWER(a.email) = LOWER(:e)', { e: trimmed })
      .getOne();
  }

  private async seedDefaultAdmin() {
    const count = await this.adminRepository.count();
    if (count === 0) {
      const admin = this.adminRepository.create({
        email: this.primaryAdminEmail,
        password: this.primaryAdminInitialPassword,
        adminId: 'ADM-001',
        role: 'admin',
      });
      await this.adminRepository.save(admin);
      this.logger.log(
        `Default admin seeded: ${this.primaryAdminEmail} / ${this.primaryAdminInitialPassword}`,
      );
      return;
    }
    await this.reconcilePrimaryAdmin();
  }

  private async assignBootstrapCredentials(admin: Admin): Promise<void> {
    admin.email = this.primaryAdminEmail;
    admin.password = await bcrypt.hash(this.primaryAdminInitialPassword, 10);
    admin.passwordResetOtp = null;
    admin.passwordResetOtpExpiresAt = null;
    await this.adminRepository.save(admin);
  }

  /**
   * Brings the DB in line with the primary admin email/password:
   * 1) Legacy admin@cooler.com → primary Gmail + bootstrap password
   * 2) If primary email missing but exactly one admin row → assign primary + bootstrap
   * 3) If ADMIN_SYNC_PRIMARY_PASSWORD=true → force bootstrap password for primary email (recovery lockout)
   */
  private async reconcilePrimaryAdmin() {
    const legacy = await this.findAdminByEmailCaseInsensitive('admin@cooler.com');
    if (legacy) {
      const targetTaken = await this.findAdminByEmailCaseInsensitive(this.primaryAdminEmail);
      if (targetTaken && targetTaken.id !== legacy.id) {
        this.logger.warn(
          'Legacy admin@cooler.com found but primary email already in use on another row — skip migration.',
        );
      } else {
        await this.assignBootstrapCredentials(legacy);
        this.logger.log(
          `Migrated admin@cooler.com → ${this.primaryAdminEmail} / ${this.primaryAdminInitialPassword}`,
        );
      }
    }

    let primary = await this.findAdminByEmailCaseInsensitive(this.primaryAdminEmail);
    if (!primary) {
      const all = await this.adminRepository.find();
      if (all.length === 1) {
        await this.assignBootstrapCredentials(all[0]);
        this.logger.warn(
          `Single admin row reassigned to ${this.primaryAdminEmail} with bootstrap password.`,
        );
        primary = all[0];
      }
    }

    const syncPwd = this.config.get<string>('ADMIN_SYNC_PRIMARY_PASSWORD')?.trim() === 'true';
    if (syncPwd && primary) {
      const alreadyOk = await bcrypt.compare(
        this.primaryAdminInitialPassword,
        primary.password,
      );
      if (!alreadyOk) {
        await this.assignBootstrapCredentials(primary);
        this.logger.warn(
          'ADMIN_SYNC_PRIMARY_PASSWORD: primary password did not match bootstrap — reset. Set env to false after login if you change the password.',
        );
      }
    }
  }

  async login(dto: LoginAdminDto) {
    const email = dto.email?.trim() ?? '';
    const admin = await this.findAdminByEmailCaseInsensitive(email);
    if (!admin) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    const rawPassword = dto.password ?? '';
    const isMatch = await bcrypt.compare(rawPassword, admin.password);
    if (!isMatch) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const token = this.jwtService.sign(
      { id: admin.id, email: admin.email, adminId: admin.adminId },
      { secret: this.config.get<string>('JWT_SECRET'), expiresIn: '24h' },
    );

    return {
      access_token: token,
      admin: {
        id: admin.id,
        email: admin.email,
        adminId: admin.adminId,
        role: admin.role,
      },
    };
  }

  async updateCredentials(id: number, dto: UpdateCredentialsDto) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
    }

    const changes: { field: string; newValue?: string }[] = [];

    if (dto.email && dto.email !== admin.email) {
      changes.push({ field: 'Email', newValue: dto.email });
      admin.email = dto.email;
    }
    if (dto.adminId && dto.adminId !== admin.adminId) {
      changes.push({ field: 'Admin ID', newValue: dto.adminId });
      admin.adminId = dto.adminId;
    }
    if (dto.password) {
      changes.push({ field: 'Password', newValue: undefined });
      admin.password = await bcrypt.hash(dto.password, 10);
    }

    if (changes.length === 0) {
      return { message: 'No changes detected' };
    }

    await this.adminRepository.save(admin);

    const emailTarget = dto.email || admin.email;
    this.mailService
      .sendCredentialUpdateEmail(emailTarget, changes)
      .catch((err) => this.logger.error('Email send error:', err));

    return { message: 'Credentials updated successfully (TypeORM). A notification email has been sent.' };
  }

  async getProfile(id: number) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
    delete admin.password;
    return admin;
  }

  /**
   * Sends a 6-digit OTP to ADMIN_PASSWORD_RESET_EMAIL (default: same Gmail as primary admin).
   * Same response whether or not the email exists (avoid account enumeration).
   */
  async requestPasswordReset(dto: RequestAdminPasswordResetDto) {
    const notifyTo =
      this.config.get<string>('ADMIN_PASSWORD_RESET_EMAIL')?.trim() ||
      this.primaryAdminEmail;

    const admin = await this.findAdminByEmailCaseInsensitive(dto.email);

    const genericMessage =
      'If an account exists for this email, a verification code was sent to the registered recovery address.';

    if (!admin) {
      return { message: genericMessage };
    }

    const otp = Helper.generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    admin.passwordResetOtp = otp;
    admin.passwordResetOtpExpiresAt = expires;
    await this.adminRepository.save(admin);

    try {
      await this.mailService.sendAdminPasswordResetOtp(notifyTo, otp, admin.email);
    } catch {
      admin.passwordResetOtp = null;
      admin.passwordResetOtpExpiresAt = null;
      await this.adminRepository.save(admin);
      throw new HttpException(
        'Could not send email. Check SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASS).',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return { message: genericMessage };
  }

  async resetPasswordWithOtp(dto: ResetAdminPasswordDto) {
    const admin = await this.findAdminByEmailCaseInsensitive(dto.email);

    if (
      !admin ||
      !admin.passwordResetOtp ||
      !admin.passwordResetOtpExpiresAt ||
      admin.passwordResetOtp !== dto.otp.trim()
    ) {
      throw new HttpException('Invalid or expired code.', HttpStatus.UNAUTHORIZED);
    }

    if (new Date() > admin.passwordResetOtpExpiresAt) {
      throw new HttpException('Code has expired. Request a new one.', HttpStatus.UNAUTHORIZED);
    }

    admin.password = await bcrypt.hash(dto.newPassword, 10);
    admin.passwordResetOtp = null;
    admin.passwordResetOtpExpiresAt = null;
    await this.adminRepository.save(admin);

    return { message: 'Password updated. You can sign in with your new password.' };
  }
}
