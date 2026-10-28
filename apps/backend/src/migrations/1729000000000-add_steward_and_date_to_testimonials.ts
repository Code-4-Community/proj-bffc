import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStewardAndDateToTestimonials1729000000000
  implements MigrationInterface
{
  name = 'AddStewardAndDateToTestimonials1729000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "testimonials" ADD "steward_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "testimonials" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "testimonials" ADD CONSTRAINT "FK_testimonials_steward_id" FOREIGN KEY ("steward_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "testimonials" DROP CONSTRAINT "FK_testimonials_steward_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "testimonials" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "testimonials" DROP COLUMN "steward_id"`,
    );
  }
}
