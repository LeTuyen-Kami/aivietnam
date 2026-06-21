import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "general_settings" ADD COLUMN IF NOT EXISTS "logo_link" varchar DEFAULT '/';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "general_settings" DROP COLUMN IF EXISTS "logo_link";`)
}
