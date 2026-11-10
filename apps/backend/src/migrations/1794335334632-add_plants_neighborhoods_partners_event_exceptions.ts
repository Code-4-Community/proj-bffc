import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlantsNeighborhoodsPartnersEventExceptions1794335334632
  implements MigrationInterface
{
  name = 'AddPlantsNeighborhoodsPartnersEventExceptions1794335334632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Plants: turn plant_inventory into plants, keeping existing rows
    await queryRunner.query(`ALTER TABLE "plant_inventory" RENAME TO "plants"`);
    await queryRunner.query(
      `ALTER TABLE "plants" RENAME CONSTRAINT "PK_613e6a4ff402c970886f5bcf3f3" TO "PK_7056d6b283b48ee2bb0e53bee60"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plants" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "plants" ADD "flavor" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "plants" ADD "harvestSeason" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "plants" ADD "howToHarvest" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "plants" ADD "recipes" text array NOT NULL DEFAULT '{}'`,
    );

    // Plants <-> sites join table, backfilled from plants.site_id
    await queryRunner.query(
      `CREATE TABLE "site_plants" ("plant_id" uuid NOT NULL, "site_id" uuid NOT NULL, CONSTRAINT "PK_4c9a585edc8c6ef8bb75cac8c10" PRIMARY KEY ("plant_id", "site_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e14415e1962ad5936943f007b" ON "site_plants" ("plant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ec8420b2534fdb7017b44d256" ON "site_plants" ("site_id")`,
    );
    await queryRunner.query(
      `INSERT INTO "site_plants" ("plant_id", "site_id") SELECT "id", "site_id" FROM "plants" WHERE "site_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "plants" DROP CONSTRAINT "FK_2be810797e6a4b9b0af8edcb440"`,
    );
    await queryRunner.query(`ALTER TABLE "plants" DROP COLUMN "site_id"`);

    // Partner orgs <-> sites join table, backfilled from partner_orgs.site_id
    await queryRunner.query(
      `CREATE TABLE "site_partners" ("partner_org_id" uuid NOT NULL, "site_id" uuid NOT NULL, CONSTRAINT "PK_b0e5da40ba587cb9b077c6b5c4e" PRIMARY KEY ("partner_org_id", "site_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7209a190718370a6c9c2ddf3f8" ON "site_partners" ("partner_org_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b08f2a39365512f50daa54685" ON "site_partners" ("site_id")`,
    );
    await queryRunner.query(
      `INSERT INTO "site_partners" ("partner_org_id", "site_id") SELECT "id", "site_id" FROM "partner_orgs" WHERE "site_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_orgs" DROP CONSTRAINT "FK_0b110f4880dd6cf8d21723fd6d4"`,
    );
    await queryRunner.query(`ALTER TABLE "partner_orgs" DROP COLUMN "site_id"`);

    // Neighborhoods, linked from addresses
    await queryRunner.query(
      `CREATE TABLE "neighborhoods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "boundary" geometry(MultiPolygon,4326) NOT NULL, CONSTRAINT "PK_249f3b7c3601adff79e56fa36f6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD "neighborhood_id" uuid`,
    );

    // Event exceptions for cancelling/rescheduling one recurring event occurrence
    await queryRunner.query(
      `CREATE TABLE "event_exceptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalDate" date NOT NULL, "cancelled" boolean NOT NULL DEFAULT true, "reason" character varying, "newStartTime" TIMESTAMP WITH TIME ZONE, "newDuration" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "event_id" uuid, CONSTRAINT "UQ_9e5c29e8401338c372445d4d8b0" UNIQUE ("event_id", "originalDate"), CONSTRAINT "PK_8a1caf292287b7e6d2509e93d59" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `ALTER TABLE "site_plants" ADD CONSTRAINT "FK_5e14415e1962ad5936943f007b1" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_plants" ADD CONSTRAINT "FK_3ec8420b2534fdb7017b44d256f" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_partners" ADD CONSTRAINT "FK_7209a190718370a6c9c2ddf3f83" FOREIGN KEY ("partner_org_id") REFERENCES "partner_orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_partners" ADD CONSTRAINT "FK_6b08f2a39365512f50daa54685d" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_6741b6c68f7ac6b041f0a4b0fb4" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_exceptions" ADD CONSTRAINT "FK_c6bce63fc6d3046fe21e366be9b" FOREIGN KEY ("event_id") REFERENCES "recurring_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_exceptions" DROP CONSTRAINT "FK_c6bce63fc6d3046fe21e366be9b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" DROP CONSTRAINT "FK_6741b6c68f7ac6b041f0a4b0fb4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_partners" DROP CONSTRAINT "FK_6b08f2a39365512f50daa54685d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_partners" DROP CONSTRAINT "FK_7209a190718370a6c9c2ddf3f83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_plants" DROP CONSTRAINT "FK_3ec8420b2534fdb7017b44d256f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_plants" DROP CONSTRAINT "FK_5e14415e1962ad5936943f007b1"`,
    );

    await queryRunner.query(`DROP TABLE "event_exceptions"`);
    await queryRunner.query(
      `ALTER TABLE "addresses" DROP COLUMN "neighborhood_id"`,
    );
    await queryRunner.query(`DROP TABLE "neighborhoods"`);

    // Restore partner_orgs.site_id (keeps one site per org)
    await queryRunner.query(`ALTER TABLE "partner_orgs" ADD "site_id" uuid`);
    await queryRunner.query(
      `UPDATE "partner_orgs" p SET "site_id" = sp."site_id" FROM (SELECT DISTINCT ON ("partner_org_id") "partner_org_id", "site_id" FROM "site_partners") sp WHERE sp."partner_org_id" = p."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_orgs" ADD CONSTRAINT "FK_0b110f4880dd6cf8d21723fd6d4" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`DROP TABLE "site_partners"`);

    // Restore plant_inventory.site_id (keeps one site per plant)
    await queryRunner.query(`ALTER TABLE "plants" ADD "site_id" uuid`);
    await queryRunner.query(
      `UPDATE "plants" p SET "site_id" = sp."site_id" FROM (SELECT DISTINCT ON ("plant_id") "plant_id", "site_id" FROM "site_plants") sp WHERE sp."plant_id" = p."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plants" ADD CONSTRAINT "FK_2be810797e6a4b9b0af8edcb440" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`DROP TABLE "site_plants"`);
    await queryRunner.query(`ALTER TABLE "plants" DROP COLUMN "recipes"`);
    await queryRunner.query(`ALTER TABLE "plants" DROP COLUMN "howToHarvest"`);
    await queryRunner.query(`ALTER TABLE "plants" DROP COLUMN "harvestSeason"`);
    await queryRunner.query(`ALTER TABLE "plants" DROP COLUMN "flavor"`);
    await queryRunner.query(`ALTER TABLE "plants" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "plants" RENAME CONSTRAINT "PK_7056d6b283b48ee2bb0e53bee60" TO "PK_613e6a4ff402c970886f5bcf3f3"`,
    );
    await queryRunner.query(`ALTER TABLE "plants" RENAME TO "plant_inventory"`);
  }
}
