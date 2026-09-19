import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1789710910806 implements MigrationInterface {
  name = 'InitSchema1789710910806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admin_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "date" date NOT NULL, "time" TIME NOT NULL, "place" character varying NOT NULL, "registrationLink" character varying NOT NULL, "site_id" uuid, CONSTRAINT "PK_c1db084f3958696d288181daa6b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "steward_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "date" date NOT NULL, "time" TIME NOT NULL, "place" character varying NOT NULL, "site_id" uuid, "steward_id" uuid, CONSTRAINT "PK_ad1a97e14126f16baff41442abe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "plant_inventory" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plantName" character varying NOT NULL, "site_id" uuid, CONSTRAINT "PK_613e6a4ff402c970886f5bcf3f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "s3Key" character varying NOT NULL, "site_id" uuid, CONSTRAINT "PK_1fe148074c6a1a91b63cb9ee3c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "s3Key" character varying NOT NULL, "site_id" uuid, CONSTRAINT "PK_e4c86c0cf95aff16e9fb8220f6b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "testimonials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "answer" text NOT NULL, "site_id" uuid, CONSTRAINT "PK_63b03c608bd258f115a0a4a1060" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "announcements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "info" text NOT NULL, "steward_id" uuid, "site_id" uuid, CONSTRAINT "PK_b3ad760876ff2e19d58e05dc8b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "partner_orgs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "site_id" uuid, CONSTRAINT "PK_46340c94052697f59c4e58263e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "volunteer_opportunities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "date" date NOT NULL, "site_id" uuid, CONSTRAINT "PK_5e67aecff962b829e0c0b169a1b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "street" character varying NOT NULL, "city" character varying NOT NULL, "state" character varying NOT NULL, "zip" character varying NOT NULL, "location" geometry(Point,4326) NOT NULL, "geojson" jsonb, "site_id" uuid, CONSTRAINT "REL_95a3cd3111b64040d4591a992e" UNIQUE ("site_id"), CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sites_type_enum" AS ENUM('existing_land_trust', 'existing_coalition', 'emerging_land_trust', 'emerging_coalition')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "history" character varying NOT NULL, "accessibility" character varying NOT NULL, "type" "public"."sites_type_enum" NOT NULL, "user_id" uuid, CONSTRAINT "PK_4f5eccb1dfde10c9170502595a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_type_enum" AS ENUM('admin', 'steward')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "type" "public"."users_type_enum" NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_events" ADD CONSTRAINT "FK_e12d12b5647e40c1fb1e23880e8" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "steward_events" ADD CONSTRAINT "FK_5cf6003f4df40c68da2548dee98" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "steward_events" ADD CONSTRAINT "FK_a30b1e4f41de605f45b52f47ff9" FOREIGN KEY ("steward_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "plant_inventory" ADD CONSTRAINT "FK_2be810797e6a4b9b0af8edcb440" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "images" ADD CONSTRAINT "FK_4ebf9371c2bc04a5a944c54794f" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD CONSTRAINT "FK_a1e71c4cfb7f728b93c7f4e9ca9" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "testimonials" ADD CONSTRAINT "FK_e62b36e3a0f19099051b78390ed" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcements" ADD CONSTRAINT "FK_e3a5a3e793358b6b175968e470b" FOREIGN KEY ("steward_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcements" ADD CONSTRAINT "FK_5dc353318f4c2d7bdc1d28ca261" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_orgs" ADD CONSTRAINT "FK_0b110f4880dd6cf8d21723fd6d4" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "volunteer_opportunities" ADD CONSTRAINT "FK_be52da058e8a84b87c434139c3c" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_95a3cd3111b64040d4591a992e8" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sites" ADD CONSTRAINT "FK_24c21d04fcce0511d6c52ed9659" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sites" DROP CONSTRAINT "FK_24c21d04fcce0511d6c52ed9659"`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" DROP CONSTRAINT "FK_95a3cd3111b64040d4591a992e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "volunteer_opportunities" DROP CONSTRAINT "FK_be52da058e8a84b87c434139c3c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_orgs" DROP CONSTRAINT "FK_0b110f4880dd6cf8d21723fd6d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcements" DROP CONSTRAINT "FK_5dc353318f4c2d7bdc1d28ca261"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcements" DROP CONSTRAINT "FK_e3a5a3e793358b6b175968e470b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "testimonials" DROP CONSTRAINT "FK_e62b36e3a0f19099051b78390ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" DROP CONSTRAINT "FK_a1e71c4cfb7f728b93c7f4e9ca9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "images" DROP CONSTRAINT "FK_4ebf9371c2bc04a5a944c54794f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plant_inventory" DROP CONSTRAINT "FK_2be810797e6a4b9b0af8edcb440"`,
    );
    await queryRunner.query(
      `ALTER TABLE "steward_events" DROP CONSTRAINT "FK_a30b1e4f41de605f45b52f47ff9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "steward_events" DROP CONSTRAINT "FK_5cf6003f4df40c68da2548dee98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_events" DROP CONSTRAINT "FK_e12d12b5647e40c1fb1e23880e8"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_type_enum"`);
    await queryRunner.query(`DROP TABLE "sites"`);
    await queryRunner.query(`DROP TYPE "public"."sites_type_enum"`);
    await queryRunner.query(`DROP TABLE "addresses"`);
    await queryRunner.query(`DROP TABLE "volunteer_opportunities"`);
    await queryRunner.query(`DROP TABLE "partner_orgs"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(`DROP TABLE "testimonials"`);
    await queryRunner.query(`DROP TABLE "videos"`);
    await queryRunner.query(`DROP TABLE "images"`);
    await queryRunner.query(`DROP TABLE "plant_inventory"`);
    await queryRunner.query(`DROP TABLE "steward_events"`);
    await queryRunner.query(`DROP TABLE "admin_events"`);
  }
}
