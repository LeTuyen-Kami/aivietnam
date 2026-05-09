import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "livestreams"
      ADD COLUMN IF NOT EXISTS "cover_image_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "livestreams"
        ADD CONSTRAINT "livestreams_cover_image_id_media_id_fk"
        FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestreams_cover_image_idx"
      ON "livestreams" USING btree ("cover_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestreams_cover_image_idx";
  `)

  await db.execute(sql`
    ALTER TABLE "livestreams"
      DROP CONSTRAINT IF EXISTS "livestreams_cover_image_id_media_id_fk";
  `)

  await db.execute(sql`
    ALTER TABLE "livestreams"
      DROP COLUMN IF EXISTS "cover_image_id";
  `)
}
