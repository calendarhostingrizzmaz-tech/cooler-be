import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminPasswordResetOtp1770854400000 implements MigrationInterface {
  name = 'AdminPasswordResetOtp1770854400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "passwordResetOtp" character varying(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "passwordResetOtpExpiresAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admins" DROP COLUMN IF EXISTS "passwordResetOtpExpiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" DROP COLUMN IF EXISTS "passwordResetOtp"`,
    );
  }
}
