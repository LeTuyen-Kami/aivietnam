import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Removes Portal split (`psl`) mobile ad embed fields; use page-level `targetedAdSlot` block instead.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "psl"
      DROP COLUMN IF EXISTS "mobile_ad_html",
      DROP COLUMN IF EXISTS "mobile_ad_css",
      DROP COLUMN IF EXISTS "mobile_ad_script";

    ALTER TABLE "_psl_v"
      DROP COLUMN IF EXISTS "mobile_ad_html",
      DROP COLUMN IF EXISTS "mobile_ad_css",
      DROP COLUMN IF EXISTS "mobile_ad_script";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "psl"
      ADD COLUMN IF NOT EXISTS "mobile_ad_html" varchar,
      ADD COLUMN IF NOT EXISTS "mobile_ad_css" varchar,
      ADD COLUMN IF NOT EXISTS "mobile_ad_script" varchar;

    ALTER TABLE "_psl_v"
      ADD COLUMN IF NOT EXISTS "mobile_ad_html" varchar,
      ADD COLUMN IF NOT EXISTS "mobile_ad_css" varchar,
      ADD COLUMN IF NOT EXISTS "mobile_ad_script" varchar;
  `)
}
