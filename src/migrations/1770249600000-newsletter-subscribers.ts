import { MigrationInterface, QueryRunner } from 'typeorm';

export class newsletterSubscribers1770249600000 implements MigrationInterface {
  name = 'newsletterSubscribers1770249600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone,
        "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone,
        "deleted_at" TIMESTAMP,
        "email" character varying(320) NOT NULL,
        CONSTRAINT "UQ_newsletter_subscribers_email" UNIQUE ("email"),
        CONSTRAINT "PK_newsletter_subscribers" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscribers"`);
  }
}
