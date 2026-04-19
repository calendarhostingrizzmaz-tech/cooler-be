import { Helper } from '@/utils';
import { Entity, Column, BeforeInsert } from 'typeorm';
import Model from './base.entity';

@Entity('users')
export class User extends Model {
  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'otp_code', nullable: true, type: 'varchar', length: 6 })
  otpCode: string;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_password_forget', type: 'boolean', default: false })
  isPasswordForget: boolean;

  @Column({ name: 'is_profile_complete', type: 'boolean', default: false })
  isProfileComplete: boolean;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await Helper.hashPassword(this.password);
    }
  }
}
