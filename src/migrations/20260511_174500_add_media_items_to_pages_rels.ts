import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_rels" ADD COLUMN IF NOT EXISTS "media_items_id" integer;
    ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "media_items_id" integer;

    DO $$ BEGIN
      ALTER TABLE "pages_rels"
        ADD CONSTRAINT "pages_rels_media_items_fk"
        FOREIGN KEY ("media_items_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_rels"
        ADD CONSTRAINT "_pages_v_rels_media_items_fk"
        FOREIGN KEY ("media_items_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_rels_media_items_id_idx" ON "pages_rels" USING btree ("media_items_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_rels_media_items_id_idx" ON "_pages_v_rels" USING btree ("media_items_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "pages_rels_media_items_id_idx";
    DROP INDEX IF EXISTS "_pages_v_rels_media_items_id_idx";

    ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_media_items_fk";
    ALTER TABLE "_pages_v_rels" DROP CONSTRAINT IF EXISTS "_pages_v_rels_media_items_fk";

    ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "media_items_id";
    ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "media_items_id";
  `)
}
