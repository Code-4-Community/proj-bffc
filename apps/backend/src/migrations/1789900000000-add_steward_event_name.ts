import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStewardEventName1789900000000 implements MigrationInterface {
  name = 'AddStewardEventName1789900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill existing rows with their description, then require the column
    await queryRunner.query(
      `ALTER TABLE "steward_events" ADD "name" character varying`,
    );
    await queryRunner.query(
      `UPDATE "steward_events" SET "name" = "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "steward_events" ALTER COLUMN "name" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "steward_events" DROP COLUMN "name"`);
  }
}
