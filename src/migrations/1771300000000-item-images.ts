import { MigrationInterface, QueryRunner } from 'typeorm';

export class ItemImages1771300000000 implements MigrationInterface {
  name = 'ItemImages1771300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "item_images" (
        "id" SERIAL NOT NULL,
        "url" character varying NOT NULL,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "itemId" integer NOT NULL,
        "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "deleted_at" TIMESTAMP(6),
        CONSTRAINT "PK_item_images" PRIMARY KEY ("id"),
        CONSTRAINT "FK_item_images_item" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "item_images" ("url", "sortOrder", "itemId", "created_at", "updated_at")
      SELECT TRIM(i."image"), 0, i."id", CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
      FROM "items" i
      WHERE i."image" IS NOT NULL AND TRIM(i."image") <> ''
      AND NOT EXISTS (
        SELECT 1 FROM "item_images" img WHERE img."itemId" = i."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "item_images"`);
  }
}
