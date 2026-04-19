import { MigrationInterface, QueryRunner } from 'typeorm';

export class ItemDiscountedPrice1770768000000 implements MigrationInterface {
  name = 'ItemDiscountedPrice1770768000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "discountedPrice" numeric(10,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "items" DROP COLUMN IF EXISTS "discountedPrice"`,
    );
  }
}
