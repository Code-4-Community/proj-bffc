import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecurringEventsAndPlantImage1792618697118
  implements MigrationInterface
{
  name = 'AddRecurringEventsAndPlantImage1792618697118';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."recurring_events_frequency_enum" AS ENUM('daily', 'weekly', 'biweekly', 'monthly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurring_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "date" date NOT NULL, "time" TIME NOT NULL, "place" character varying NOT NULL, "registrationLink" character varying NOT NULL, "frequency" "public"."recurring_events_frequency_enum" NOT NULL, "endDate" date, "site_id" uuid, CONSTRAINT "PK_111b9377caa5a9be24aafe6b014" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "plant_inventory" ADD "imageS3Key" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_events" ADD CONSTRAINT "FK_88a3b07893e99685f3eaab77aea" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recurring_events" DROP CONSTRAINT "FK_88a3b07893e99685f3eaab77aea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plant_inventory" DROP COLUMN "imageS3Key"`,
    );
    await queryRunner.query(`DROP TABLE "recurring_events"`);
    await queryRunner.query(
      `DROP TYPE "public"."recurring_events_frequency_enum"`,
    );
  }
}
