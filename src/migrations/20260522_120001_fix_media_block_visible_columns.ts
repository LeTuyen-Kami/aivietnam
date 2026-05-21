import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Repair media_block_visible tables if an earlier migration used `_order` / `_parent_id`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_media_block_visible" AS ENUM('all', 'mobile', 'tablet', 'desktop');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__pages_v_blocks_media_block_visible" AS ENUM('all', 'mobile', 'tablet', 'desktop');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    -- Wrong column names from initial migration: drop and recreate (tables are new / usually empty).
    DROP TABLE IF EXISTS "pages_blocks_media_block_visible";
    DROP TABLE IF EXISTS "_pages_v_blocks_media_block_visible";

    CREATE TABLE "pages_blocks_media_block_visible" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "value" "enum_pages_blocks_media_block_visible"
    );

    CREATE TABLE "_pages_v_blocks_media_block_visible" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "value" "enum__pages_v_blocks_media_block_visible"
    );

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_media_block_visible"
        ADD CONSTRAINT "pages_blocks_media_block_visible_parent_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_media_block"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_media_block_visible"
        ADD CONSTRAINT "_pages_v_blocks_media_block_visible_parent_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v_blocks_media_block"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_media_block_visible_order_idx"
      ON "pages_blocks_media_block_visible" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_media_block_visible_parent_id_idx"
      ON "pages_blocks_media_block_visible" USING btree ("parent_id");

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_media_block_visible_order_idx"
      ON "_pages_v_blocks_media_block_visible" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_media_block_visible_parent_id_idx"
      ON "_pages_v_blocks_media_block_visible" USING btree ("parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "pages_blocks_media_block_visible_order_idx";
    DROP INDEX IF EXISTS "pages_blocks_media_block_visible_parent_id_idx";
    DROP INDEX IF EXISTS "_pages_v_blocks_media_block_visible_order_idx";
    DROP INDEX IF EXISTS "_pages_v_blocks_media_block_visible_parent_id_idx";

    ALTER TABLE "pages_blocks_media_block_visible"
      DROP CONSTRAINT IF EXISTS "pages_blocks_media_block_visible_parent_id_fk";
    ALTER TABLE "_pages_v_blocks_media_block_visible"
      DROP CONSTRAINT IF EXISTS "_pages_v_blocks_media_block_visible_parent_id_fk";

    DROP TABLE IF EXISTS "pages_blocks_media_block_visible";
    DROP TABLE IF EXISTS "_pages_v_blocks_media_block_visible";
  `)
}
