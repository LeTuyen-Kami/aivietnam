import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "header" ADD COLUMN IF NOT EXISTS "mobile_banner_image_id" integer;

    DO $$ BEGIN
      ALTER TABLE "header"
        ADD CONSTRAINT "header_mobile_banner_image_id_media_id_fk"
        FOREIGN KEY ("mobile_banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "header_mobile_banner_image_idx" ON "header" USING btree ("mobile_banner_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "header_mobile_banner_image_idx";

    ALTER TABLE "header" DROP CONSTRAINT IF EXISTS "header_mobile_banner_image_id_media_id_fk";

    ALTER TABLE "header" DROP COLUMN IF EXISTS "mobile_banner_image_id";
  `)
}
