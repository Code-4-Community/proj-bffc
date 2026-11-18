import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventNameAndType1790000000001 implements MigrationInterface {
  name = 'AddEventNameAndType1790000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admin_events" ADD "name" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `UPDATE "admin_events" SET "name" = "description" WHERE "name" = ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_events" ALTER COLUMN "name" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "admin_events" DROP COLUMN "name"`);
  }
}
