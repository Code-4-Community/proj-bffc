import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRecurringEventsFields1793224666483
  implements MigrationInterface
{
  name = 'UpdateRecurringEventsFields1793224666483';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename instead of drop + add so existing start dates are kept
    await queryRunner.query(
      `ALTER TABLE "recurring_events" RENAME COLUMN "date" TO "startDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_events" DROP COLUMN "registrationLink"`,
    );
    // Existing rows have no name, so backfill from description before
    // making the column NOT NULL
    await queryRunner.query(
      `ALTER TABLE "recurring_events" ADD "name" character varying`,
    );
    await queryRunner.query(
      `UPDATE "recurring_events" SET "name" = "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_events" ALTER COLUMN "name" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recurring_events" DROP COLUMN "name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_events" ADD "registrationLink" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_events" ALTER COLUMN "registrationLink" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_events" RENAME COLUMN "startDate" TO "date"`,
    );
  }
}
