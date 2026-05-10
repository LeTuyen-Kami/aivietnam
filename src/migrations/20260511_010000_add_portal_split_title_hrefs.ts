import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "pages_blocks_psl"
      ADD COLUMN IF NOT EXISTS "row1_left_title_href" varchar;

    ALTER TABLE IF EXISTS "pages_blocks_psl"
      ADD COLUMN IF NOT EXISTS "row1_right_title_href" varchar;

    ALTER TABLE IF EXISTS "pages_blocks_psl_std"
      ADD COLUMN IF NOT EXISTS "section_title_href" varchar;

    ALTER TABLE IF EXISTS "_pages_v_blocks_psl"
      ADD COLUMN IF NOT EXISTS "row1_left_title_href" varchar;

    ALTER TABLE IF EXISTS "_pages_v_blocks_psl"
      ADD COLUMN IF NOT EXISTS "row1_right_title_href" varchar;

    ALTER TABLE IF EXISTS "_pages_v_blocks_psl_std"
      ADD COLUMN IF NOT EXISTS "section_title_href" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "_pages_v_blocks_psl_std"
      DROP COLUMN IF EXISTS "section_title_href";

    ALTER TABLE IF EXISTS "_pages_v_blocks_psl"
      DROP COLUMN IF EXISTS "row1_right_title_href";

    ALTER TABLE IF EXISTS "_pages_v_blocks_psl"
      DROP COLUMN IF EXISTS "row1_left_title_href";

    ALTER TABLE IF EXISTS "pages_blocks_psl_std"
      DROP COLUMN IF EXISTS "section_title_href";

    ALTER TABLE IF EXISTS "pages_blocks_psl"
      DROP COLUMN IF EXISTS "row1_right_title_href";

    ALTER TABLE IF EXISTS "pages_blocks_psl"
      DROP COLUMN IF EXISTS "row1_left_title_href";
  `)
}
