import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Portal split — Góc nhân văn (merged):
 * - `humanitarianItems` → `hnv_items` / `_hnv_items_v` (image + href)
 * - `humanitarianArticles` → `hnv_art` / `_hnv_art_v` (post relationship, post_id)
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "hnv_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer,
      "href" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "hnv_items"
        ADD CONSTRAINT "hnv_items_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."psl"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "hnv_items"
        ADD CONSTRAINT "hnv_items_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "hnv_items_order_idx" ON "hnv_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hnv_items_parent_id_idx" ON "hnv_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "hnv_items_image_idx" ON "hnv_items" USING btree ("image_id");

    CREATE TABLE IF NOT EXISTS "_hnv_items_v" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "image_id" integer,
      "href" varchar,
      "_uuid" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "_hnv_items_v"
        ADD CONSTRAINT "_hnv_items_v_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_psl_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_hnv_items_v"
        ADD CONSTRAINT "_hnv_items_v_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "_hnv_items_v_order_idx" ON "_hnv_items_v" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_hnv_items_v_parent_id_idx" ON "_hnv_items_v" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_hnv_items_v_image_idx" ON "_hnv_items_v" USING btree ("image_id");

    CREATE TABLE IF NOT EXISTS "hnv_art" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "post_id" integer NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "hnv_art"
        ADD CONSTRAINT "hnv_art_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."psl"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "hnv_art"
        ADD CONSTRAINT "hnv_art_post_id_posts_id_fk"
        FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "hnv_art_order_idx" ON "hnv_art" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hnv_art_parent_id_idx" ON "hnv_art" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "hnv_art_post_idx" ON "hnv_art" USING btree ("post_id");

    CREATE TABLE IF NOT EXISTS "_hnv_art_v" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "post_id" integer,
      "_uuid" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "_hnv_art_v"
        ADD CONSTRAINT "_hnv_art_v_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_psl_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_hnv_art_v"
        ADD CONSTRAINT "_hnv_art_v_post_id_posts_id_fk"
        FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "_hnv_art_v_order_idx" ON "_hnv_art_v" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_hnv_art_v_parent_id_idx" ON "_hnv_art_v" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_hnv_art_v_post_idx" ON "_hnv_art_v" USING btree ("post_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "_hnv_art_v_post_idx";
    DROP INDEX IF EXISTS "_hnv_art_v_parent_id_idx";
    DROP INDEX IF EXISTS "_hnv_art_v_order_idx";

    ALTER TABLE "_hnv_art_v" DROP CONSTRAINT IF EXISTS "_hnv_art_v_post_id_posts_id_fk";
    ALTER TABLE "_hnv_art_v" DROP CONSTRAINT IF EXISTS "_hnv_art_v_parent_id_fk";

    DROP TABLE IF EXISTS "_hnv_art_v";

    DROP INDEX IF EXISTS "hnv_art_post_idx";
    DROP INDEX IF EXISTS "hnv_art_parent_id_idx";
    DROP INDEX IF EXISTS "hnv_art_order_idx";

    ALTER TABLE "hnv_art" DROP CONSTRAINT IF EXISTS "hnv_art_post_id_posts_id_fk";
    ALTER TABLE "hnv_art" DROP CONSTRAINT IF EXISTS "hnv_art_parent_id_fk";

    DROP TABLE IF EXISTS "hnv_art";

    DROP INDEX IF EXISTS "_hnv_items_v_image_idx";
    DROP INDEX IF EXISTS "_hnv_items_v_parent_id_idx";
    DROP INDEX IF EXISTS "_hnv_items_v_order_idx";

    ALTER TABLE "_hnv_items_v" DROP CONSTRAINT IF EXISTS "_hnv_items_v_image_id_media_id_fk";
    ALTER TABLE "_hnv_items_v" DROP CONSTRAINT IF EXISTS "_hnv_items_v_parent_id_fk";

    DROP TABLE IF EXISTS "_hnv_items_v";

    DROP INDEX IF EXISTS "hnv_items_image_idx";
    DROP INDEX IF EXISTS "hnv_items_parent_id_idx";
    DROP INDEX IF EXISTS "hnv_items_order_idx";

    ALTER TABLE "hnv_items" DROP CONSTRAINT IF EXISTS "hnv_items_image_id_media_id_fk";
    ALTER TABLE "hnv_items" DROP CONSTRAINT IF EXISTS "hnv_items_parent_id_fk";

    DROP TABLE IF EXISTS "hnv_items";
  `)
}
