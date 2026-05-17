import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Allow empty `targetElementId` on draft/autosave for `targetedAdSlot` (table `tas`).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tas" ALTER COLUMN "target_element_id" DROP NOT NULL;
    ALTER TABLE "_tas_v" ALTER COLUMN "target_element_id" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "tas" SET "target_element_id" = '' WHERE "target_element_id" IS NULL;
    UPDATE "_tas_v" SET "target_element_id" = '' WHERE "target_element_id" IS NULL;

    ALTER TABLE "tas" ALTER COLUMN "target_element_id" SET NOT NULL;
    ALTER TABLE "_tas_v" ALTER COLUMN "target_element_id" SET NOT NULL;
  `)
}
