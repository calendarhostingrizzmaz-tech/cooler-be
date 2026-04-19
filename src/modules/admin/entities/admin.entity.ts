import { Entity, Column, BeforeInsert } from 'typeorm';
import Model from '../../../entities/base.entity';
import * as bcrypt from 'bcrypt';

@Entity('admins')
export class Admin extends Model {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  adminId: string;

  @Column({ default: 'admin' })
  role: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  passwordResetOtp: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetOtpExpiresAt: Date | null;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
