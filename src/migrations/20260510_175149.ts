import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('create', 'update', 'delete', 'read');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TYPE "public"."enum_users_roles" ADD VALUE 'editor';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TYPE "public"."enum_users_roles" ADD VALUE 'moderator';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "pages_blocks_livestream_portal" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar DEFAULT 'Livestream',
      "description" varchar DEFAULT 'Theo dõi phiên đang phát hoặc quản lý phòng livestream nếu bạn là admin.',
      "empty_message" varchar DEFAULT 'Hiện chưa có livestream nào đang phát.',
      "admin_list_limit" numeric DEFAULT 8,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_livestream_portal" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "heading" varchar DEFAULT 'Livestream',
      "description" varchar DEFAULT 'Theo dõi phiên đang phát hoặc quản lý phòng livestream nếu bạn là admin.',
      "empty_message" varchar DEFAULT 'Hiện chưa có livestream nào đang phát.',
      "admin_list_limit" numeric DEFAULT 8,
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" serial PRIMARY KEY NOT NULL,
      "collection" varchar NOT NULL,
      "action" "enum_audit_logs_action" NOT NULL,
      "document_id" varchar NOT NULL,
      "timestamp" timestamp(3) with time zone NOT NULL,
      "user_id" integer,
      "changes" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DROP INDEX IF EXISTS "media_sizes_square_sizes_square_filename_idx";
    DROP INDEX IF EXISTS "media_sizes_small_sizes_small_filename_idx";
    DROP INDEX IF EXISTS "media_sizes_medium_sizes_medium_filename_idx";
    DROP INDEX IF EXISTS "media_sizes_xlarge_sizes_xlarge_filename_idx";

    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_top_left_label_href" varchar;
    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_top_middle_label_href" varchar;
    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_top_right_label_href" varchar;
    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_middle_left_label_href" varchar;
    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_middle_right_label_href" varchar;
    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_right_upper_label_href" varchar;
    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_bottom_left_label_href" varchar;
    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_bottom_middle_label_href" varchar;
    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_bottom_right_label_href" varchar;
    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_bottom_far_left_label_href" varchar;
    ALTER TABLE "pages_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_bottom_far_right_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_top_left_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_top_middle_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_top_right_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_middle_left_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_middle_right_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_right_upper_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_bottom_left_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_bottom_middle_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_bottom_right_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_bottom_far_left_label_href" varchar;
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" ADD COLUMN IF NOT EXISTS "center_bottom_far_right_label_href" varchar;
    ALTER TABLE "livestreams" ADD COLUMN IF NOT EXISTS "cover_image_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "audit_logs_id" integer;

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_livestream_portal"
        ADD CONSTRAINT "pages_blocks_livestream_portal_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_livestream_portal"
        ADD CONSTRAINT "_pages_v_blocks_livestream_portal_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "audit_logs"
        ADD CONSTRAINT "audit_logs_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_livestream_portal_order_idx" ON "pages_blocks_livestream_portal" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_livestream_portal_parent_id_idx" ON "pages_blocks_livestream_portal" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_livestream_portal_path_idx" ON "pages_blocks_livestream_portal" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_livestream_portal_order_idx" ON "_pages_v_blocks_livestream_portal" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_livestream_portal_parent_id_idx" ON "_pages_v_blocks_livestream_portal" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_livestream_portal_path_idx" ON "_pages_v_blocks_livestream_portal" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "livestreams"
        ADD CONSTRAINT "livestreams_cover_image_id_media_id_fk"
        FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk"
        FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "livestreams_cover_image_idx" ON "livestreams" USING btree ("cover_image_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");

    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_url";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_width";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_height";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_mime_type";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_filesize";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_filename";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_url";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_width";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_height";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_mime_type";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_filesize";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_filename";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_url";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_width";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_height";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_mime_type";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_filesize";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_filename";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_url";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_width";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_height";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_mime_type";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_filesize";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_filename";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_livestream_portal" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_pages_v_blocks_livestream_portal" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "pages_blocks_livestream_portal" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_livestream_portal" CASCADE;
    DROP TABLE IF EXISTS "audit_logs" CASCADE;
    ALTER TABLE "livestreams" DROP CONSTRAINT IF EXISTS "livestreams_cover_image_id_media_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_audit_logs_fk";

    ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
    DROP TYPE IF EXISTS "public"."enum_users_roles";
    CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'member');
    ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
    DROP INDEX IF EXISTS "livestreams_cover_image_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_audit_logs_id_idx";
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_url" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_width" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_height" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_mime_type" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_filesize" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_filename" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_url" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_width" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_height" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_mime_type" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_filesize" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_filename" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_url" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_width" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_height" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_mime_type" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_filesize" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_medium_filename" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_url" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_width" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_height" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_mime_type" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_filesize" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_filename" varchar;
    CREATE INDEX IF NOT EXISTS "media_sizes_square_sizes_square_filename_idx" ON "media" USING btree ("sizes_square_filename");
    CREATE INDEX IF NOT EXISTS "media_sizes_small_sizes_small_filename_idx" ON "media" USING btree ("sizes_small_filename");
    CREATE INDEX IF NOT EXISTS "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
    CREATE INDEX IF NOT EXISTS "media_sizes_xlarge_sizes_xlarge_filename_idx" ON "media" USING btree ("sizes_xlarge_filename");
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_top_left_label_href";
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_top_middle_label_href";
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_top_right_label_href";
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_middle_left_label_href";
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_middle_right_label_href";
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_right_upper_label_href";
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_bottom_left_label_href";
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_bottom_middle_label_href";
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_bottom_right_label_href";
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_bottom_far_left_label_href";
    ALTER TABLE "pages_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_bottom_far_right_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_top_left_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_top_middle_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_top_right_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_middle_left_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_middle_right_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_right_upper_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_bottom_left_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_bottom_middle_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_bottom_right_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_bottom_far_left_label_href";
    ALTER TABLE "_pages_v_blocks_ai_ecosystem_map" DROP COLUMN IF EXISTS "center_bottom_far_right_label_href";
    ALTER TABLE "livestreams" DROP COLUMN IF EXISTS "cover_image_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "audit_logs_id";
    DROP TYPE IF EXISTS "public"."enum_audit_logs_action";
  `)
}
