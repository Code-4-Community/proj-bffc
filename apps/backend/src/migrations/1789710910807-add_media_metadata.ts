import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaMetadata1789710910807 implements MigrationInterface {
  name = 'AddMediaMetadata1789710910807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "images" ADD "title" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "images" ADD "description" text`);
    await queryRunner.query(
      `ALTER TABLE "images" ADD "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD "title" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "videos" ADD "description" text`);
    await queryRunner.query(
      `ALTER TABLE "videos" ADD "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "uploadedAt"`);
    await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "title"`);
    await queryRunner.query(`ALTER TABLE "images" DROP COLUMN "uploadedAt"`);
    await queryRunner.query(`ALTER TABLE "images" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "images" DROP COLUMN "title"`);
  }
}
