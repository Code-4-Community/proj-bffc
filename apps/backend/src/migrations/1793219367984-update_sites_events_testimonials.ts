import { MigrationInterface, QueryRunner } from 'typeorm';

const EVENT_TABLES = ['admin_events', 'steward_events', 'recurring_events'];

export class UpdateSitesEventsTestimonials1793219367984
  implements MigrationInterface
{
  name = 'UpdateSitesEventsTestimonials1793219367984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename rather than drop/add so existing event times are preserved
    for (const table of EVENT_TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" RENAME COLUMN "time" TO "startTime"`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" ADD "endTime" TIME`);
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD "flyerS3Key" character varying`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "testimonials" ADD "stewardImageS3Key" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "sites" ADD "foundingDate" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "sites" ADD "hoursOpen" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "volunteer_opportunities" DROP CONSTRAINT "FK_be52da058e8a84b87c434139c3c"`,
    );
    await queryRunner.query(`DROP TABLE "volunteer_opportunities"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "volunteer_opportunities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "date" date NOT NULL, "site_id" uuid, CONSTRAINT "PK_5e67aecff962b829e0c0b169a1b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "volunteer_opportunities" ADD CONSTRAINT "FK_be52da058e8a84b87c434139c3c" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "hoursOpen"`);
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "foundingDate"`);
    await queryRunner.query(
      `ALTER TABLE "testimonials" DROP COLUMN "stewardImageS3Key"`,
    );
    for (const table of EVENT_TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN "flyerS3Key"`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "endTime"`);
      await queryRunner.query(
        `ALTER TABLE "${table}" RENAME COLUMN "startTime" TO "time"`,
      );
    }
  }
}
