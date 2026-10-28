import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaUploadedBy1789710910808 implements MigrationInterface {
  name = 'AddMediaUploadedBy1789710910808';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "images" ADD "uploaded_by" uuid`);
    await queryRunner.query(`ALTER TABLE "videos" ADD "uploaded_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "images" ADD CONSTRAINT "FK_images_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD CONSTRAINT "FK_videos_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "videos" DROP CONSTRAINT "FK_videos_uploaded_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "images" DROP CONSTRAINT "FK_images_uploaded_by"`,
    );
    await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "uploaded_by"`);
    await queryRunner.query(`ALTER TABLE "images" DROP COLUMN "uploaded_by"`);
  }
}
