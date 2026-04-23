import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_mcp_api_keys"
      ADD COLUMN IF NOT EXISTS "listings_find" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "listings_create" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "listings_update" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "listings_delete" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_mcp_api_keys"
      DROP COLUMN IF EXISTS "listings_find",
      DROP COLUMN IF EXISTS "listings_create",
      DROP COLUMN IF EXISTS "listings_update",
      DROP COLUMN IF EXISTS "listings_delete";
  `)
}
