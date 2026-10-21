import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventNameAndType1790000000001 implements MigrationInterface {
  name = 'AddEventNameAndType1790000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admin_events" ADD "name" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_events" ADD "eventType" character varying NOT NULL DEFAULT 'community'`,
    );
    await queryRunner.query(
      `UPDATE "admin_events" SET "name" = "description" WHERE "name" = ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_events" ALTER COLUMN "name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_events" ALTER COLUMN "eventType" DROP DEFAULT`,
    );

    await queryRunner.query(
      `ALTER TABLE "steward_events" ADD "name" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "steward_events" ADD "eventType" character varying NOT NULL DEFAULT 'community'`,
    );
    await queryRunner.query(
      `UPDATE "steward_events" SET "name" = "description" WHERE "name" = ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "steward_events" ALTER COLUMN "name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "steward_events" ALTER COLUMN "eventType" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "steward_events" DROP COLUMN "eventType"`,
    );
    await queryRunner.query(`ALTER TABLE "steward_events" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "admin_events" DROP COLUMN "eventType"`,
    );
    await queryRunner.query(`ALTER TABLE "admin_events" DROP COLUMN "name"`);
  }
}
