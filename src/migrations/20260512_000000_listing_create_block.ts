import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_listing_create" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "button_label" varchar DEFAULT 'Đăng tin',
      "modal_title" varchar DEFAULT 'Đăng tin mới',
      "modal_description" varchar DEFAULT 'Tin của bạn sẽ được gửi vào hàng chờ để admin duyệt trước khi hiển thị.',
      "success_message" varchar DEFAULT 'Đã gửi tin đăng. Admin sẽ duyệt trước khi tin xuất hiện.',
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_listing_create" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "button_label" varchar DEFAULT 'Đăng tin',
      "modal_title" varchar DEFAULT 'Đăng tin mới',
      "modal_description" varchar DEFAULT 'Tin của bạn sẽ được gửi vào hàng chờ để admin duyệt trước khi hiển thị.',
      "success_message" varchar DEFAULT 'Đã gửi tin đăng. Admin sẽ duyệt trước khi tin xuất hiện.',
      "_uuid" varchar,
      "block_name" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_listing_create"
        ADD CONSTRAINT "pages_blocks_listing_create_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_listing_create"
        ADD CONSTRAINT "_pages_v_blocks_listing_create_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_listing_create_order_idx" ON "pages_blocks_listing_create" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_listing_create_parent_id_idx" ON "pages_blocks_listing_create" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_listing_create_path_idx" ON "pages_blocks_listing_create" USING btree ("_path");

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_listing_create_order_idx" ON "_pages_v_blocks_listing_create" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_listing_create_parent_id_idx" ON "_pages_v_blocks_listing_create" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_listing_create_path_idx" ON "_pages_v_blocks_listing_create" USING btree ("_path");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "pages_blocks_listing_create_order_idx";
    DROP INDEX IF EXISTS "pages_blocks_listing_create_parent_id_idx";
    DROP INDEX IF EXISTS "pages_blocks_listing_create_path_idx";
    DROP INDEX IF EXISTS "_pages_v_blocks_listing_create_order_idx";
    DROP INDEX IF EXISTS "_pages_v_blocks_listing_create_parent_id_idx";
    DROP INDEX IF EXISTS "_pages_v_blocks_listing_create_path_idx";

    ALTER TABLE "pages_blocks_listing_create" DROP CONSTRAINT IF EXISTS "pages_blocks_listing_create_parent_id_fk";
    ALTER TABLE "_pages_v_blocks_listing_create" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_listing_create_parent_id_fk";

    DROP TABLE IF EXISTS "pages_blocks_listing_create";
    DROP TABLE IF EXISTS "_pages_v_blocks_listing_create";
  `)
}
