import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Pages layout block `targetedAdSlot` (db table `tas`): client-side ad embed portaled to `document.getElementById(targetElementId)`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tas" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "target_element_id" varchar NOT NULL,
      "embed_html" varchar,
      "embed_css" varchar,
      "embed_script" varchar,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "_tas_v" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "target_element_id" varchar NOT NULL,
      "embed_html" varchar,
      "embed_css" varchar,
      "embed_script" varchar,
      "_uuid" varchar,
      "block_name" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "tas"
        ADD CONSTRAINT "tas_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_tas_v"
        ADD CONSTRAINT "_tas_v_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "tas_order_idx" ON "tas" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "tas_parent_id_idx" ON "tas" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "tas_path_idx" ON "tas" USING btree ("_path");

    CREATE INDEX IF NOT EXISTS "_tas_v_order_idx" ON "_tas_v" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_tas_v_parent_id_idx" ON "_tas_v" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_tas_v_path_idx" ON "_tas_v" USING btree ("_path");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "tas_order_idx";
    DROP INDEX IF EXISTS "tas_parent_id_idx";
    DROP INDEX IF EXISTS "tas_path_idx";
    DROP INDEX IF EXISTS "_tas_v_order_idx";
    DROP INDEX IF EXISTS "_tas_v_parent_id_idx";
    DROP INDEX IF EXISTS "_tas_v_path_idx";

    ALTER TABLE "tas" DROP CONSTRAINT IF EXISTS "tas_parent_id_fk";
    ALTER TABLE "_tas_v" DROP CONSTRAINT IF EXISTS "_tas_v_parent_id_fk";

    DROP TABLE IF EXISTS "tas";
    DROP TABLE IF EXISTS "_tas_v";
  `)
}
