import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "mht"
      ADD COLUMN IF NOT EXISTS "video_column_featured_id" integer,
      ADD COLUMN IF NOT EXISTS "photo_column_featured_id" integer;

    ALTER TABLE "_mht_v"
      ADD COLUMN IF NOT EXISTS "video_column_featured_id" integer,
      ADD COLUMN IF NOT EXISTS "photo_column_featured_id" integer;

    DO $$ BEGIN
      ALTER TABLE "mht"
        ADD CONSTRAINT "mht_video_column_featured_id_media_items_id_fk"
        FOREIGN KEY ("video_column_featured_id") REFERENCES "public"."media_items"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "mht"
        ADD CONSTRAINT "mht_photo_column_featured_id_media_items_id_fk"
        FOREIGN KEY ("photo_column_featured_id") REFERENCES "public"."media_items"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_mht_v"
        ADD CONSTRAINT "_mht_v_video_column_featured_id_media_items_id_fk"
        FOREIGN KEY ("video_column_featured_id") REFERENCES "public"."media_items"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_mht_v"
        ADD CONSTRAINT "_mht_v_photo_column_featured_id_media_items_id_fk"
        FOREIGN KEY ("photo_column_featured_id") REFERENCES "public"."media_items"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "mht_video_column_featured_idx" ON "mht" USING btree ("video_column_featured_id");
    CREATE INDEX IF NOT EXISTS "mht_photo_column_featured_idx" ON "mht" USING btree ("photo_column_featured_id");
    CREATE INDEX IF NOT EXISTS "_mht_v_video_column_featured_idx" ON "_mht_v" USING btree ("video_column_featured_id");
    CREATE INDEX IF NOT EXISTS "_mht_v_photo_column_featured_idx" ON "_mht_v" USING btree ("photo_column_featured_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "mht_video_column_featured_idx";
    DROP INDEX IF EXISTS "mht_photo_column_featured_idx";
    DROP INDEX IF EXISTS "_mht_v_video_column_featured_idx";
    DROP INDEX IF EXISTS "_mht_v_photo_column_featured_idx";

    ALTER TABLE "mht" DROP CONSTRAINT IF EXISTS "mht_video_column_featured_id_media_items_id_fk";
    ALTER TABLE "mht" DROP CONSTRAINT IF EXISTS "mht_photo_column_featured_id_media_items_id_fk";
    ALTER TABLE "_mht_v" DROP CONSTRAINT IF EXISTS "_mht_v_video_column_featured_id_media_items_id_fk";
    ALTER TABLE "_mht_v" DROP CONSTRAINT IF EXISTS "_mht_v_photo_column_featured_id_media_items_id_fk";

    ALTER TABLE "mht"
      DROP COLUMN IF EXISTS "video_column_featured_id",
      DROP COLUMN IF EXISTS "photo_column_featured_id";

    ALTER TABLE "_mht_v"
      DROP COLUMN IF EXISTS "video_column_featured_id",
      DROP COLUMN IF EXISTS "photo_column_featured_id";
  `)
}
