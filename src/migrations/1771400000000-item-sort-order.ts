import { MigrationInterface, QueryRunner } from 'typeorm';

export class ItemSortOrder1771400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "sortOrder" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      UPDATE "items" SET "sortOrder" = sub.rn
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "created_at" DESC) AS rn FROM "items"
      ) sub
      WHERE "items".id = sub.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "items" DROP COLUMN IF EXISTS "sortOrder"`);
  }
}
