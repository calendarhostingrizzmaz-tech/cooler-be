import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1770400000000 implements MigrationInterface {
  name = 'InitialSchema1770400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "deleted_at" TIMESTAMP,
        "name" character varying NOT NULL,
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "items" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "deleted_at" TIMESTAMP,
        "name" character varying NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "discountedPrice" numeric(10,2),
        "image" character varying NOT NULL,
        "description" text NOT NULL,
        "categoryId" integer,
        CONSTRAINT "PK_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_items_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admins" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "deleted_at" TIMESTAMP,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "adminId" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'admin',
        "passwordResetOtp" character varying(6),
        "passwordResetOtpExpiresAt" TIMESTAMP,
        CONSTRAINT "UQ_admins_email" UNIQUE ("email"),
        CONSTRAINT "UQ_admins_adminId" UNIQUE ("adminId"),
        CONSTRAINT "PK_admins" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "deleted_at" TIMESTAMP,
        "items" jsonb NOT NULL,
        "phone" character varying NOT NULL,
        "address" text NOT NULL,
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admins"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
