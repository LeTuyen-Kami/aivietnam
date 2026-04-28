import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "psl"
      ADD COLUMN IF NOT EXISTS "row1_left_accent_custom_hex" varchar,
      ADD COLUMN IF NOT EXISTS "row1_right_accent_custom_hex" varchar;

    ALTER TABLE "_psl_v"
      ADD COLUMN IF NOT EXISTS "row1_left_accent_custom_hex" varchar,
      ADD COLUMN IF NOT EXISTS "row1_right_accent_custom_hex" varchar;

    ALTER TABLE "std"
      ADD COLUMN IF NOT EXISTS "accent_custom_hex" varchar;

    ALTER TABLE "_std_v"
      ADD COLUMN IF NOT EXISTS "accent_custom_hex" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "psl"
      DROP COLUMN IF EXISTS "row1_left_accent_custom_hex",
      DROP COLUMN IF EXISTS "row1_right_accent_custom_hex";

    ALTER TABLE "_psl_v"
      DROP COLUMN IF EXISTS "row1_left_accent_custom_hex",
      DROP COLUMN IF EXISTS "row1_right_accent_custom_hex";

    ALTER TABLE "std"
      DROP COLUMN IF EXISTS "accent_custom_hex";

    ALTER TABLE "_std_v"
      DROP COLUMN IF EXISTS "accent_custom_hex";
  `)
}
