import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_media_items_type" AS ENUM('podcast', 'video', 'image');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_media_items_video_source_type" AS ENUM('upload', 'youtube', 'direct');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_media_items_status" AS ENUM('draft', 'published');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__media_items_v_version_type" AS ENUM('podcast', 'video', 'image');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__media_items_v_version_video_source_type" AS ENUM('upload', 'youtube', 'direct');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__media_items_v_version_status" AS ENUM('draft', 'published');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "media_categories" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "media_items" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "type" "enum_media_items_type",
      "summary" varchar,
      "content" jsonb,
      "thumbnail_id" integer,
      "image_id" integer,
      "podcast_audio_media_id" integer,
      "podcast_audio_url" varchar,
      "podcast_speaker" varchar,
      "podcast_narrator" varchar,
      "podcast_channel_name" varchar,
      "podcast_series_name" varchar,
      "podcast_episode_number" varchar,
      "podcast_audio_duration" varchar,
      "video_source_type" "enum_media_items_video_source_type",
      "video_video_media_id" integer,
      "video_youtube_url" varchar,
      "video_video_url" varchar,
      "source_name" varchar,
      "creator_name" varchar,
      "published_at" timestamp(3) with time zone,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_media_items_status" DEFAULT 'draft'
    );

    CREATE TABLE IF NOT EXISTS "media_items_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_categories_id" integer
    );

    CREATE TABLE IF NOT EXISTS "_media_items_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_title" varchar,
      "version_type" "enum__media_items_v_version_type",
      "version_summary" varchar,
      "version_content" jsonb,
      "version_thumbnail_id" integer,
      "version_image_id" integer,
      "version_podcast_audio_media_id" integer,
      "version_podcast_audio_url" varchar,
      "version_podcast_speaker" varchar,
      "version_podcast_narrator" varchar,
      "version_podcast_channel_name" varchar,
      "version_podcast_series_name" varchar,
      "version_podcast_episode_number" varchar,
      "version_podcast_audio_duration" varchar,
      "version_video_source_type" "enum__media_items_v_version_video_source_type",
      "version_video_video_media_id" integer,
      "version_video_youtube_url" varchar,
      "version_video_video_url" varchar,
      "version_source_name" varchar,
      "version_creator_name" varchar,
      "version_published_at" timestamp(3) with time zone,
      "version_generate_slug" boolean DEFAULT true,
      "version_slug" varchar,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__media_items_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean,
      "autosave" boolean
    );

    CREATE TABLE IF NOT EXISTS "_media_items_v_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_categories_id" integer
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "media_categories_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "media_items_id" integer;

    DO $$ BEGIN
      ALTER TABLE "media_items"
        ADD CONSTRAINT "media_items_thumbnail_id_media_id_fk"
        FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "media_items"
        ADD CONSTRAINT "media_items_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "media_items"
        ADD CONSTRAINT "media_items_podcast_audio_media_id_media_id_fk"
        FOREIGN KEY ("podcast_audio_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "media_items"
        ADD CONSTRAINT "media_items_video_video_media_id_media_id_fk"
        FOREIGN KEY ("video_video_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "media_items_rels"
        ADD CONSTRAINT "media_items_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "media_items_rels"
        ADD CONSTRAINT "media_items_rels_media_categories_fk"
        FOREIGN KEY ("media_categories_id") REFERENCES "public"."media_categories"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_media_items_v"
        ADD CONSTRAINT "_media_items_v_parent_id_media_items_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."media_items"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_media_items_v"
        ADD CONSTRAINT "_media_items_v_version_thumbnail_id_media_id_fk"
        FOREIGN KEY ("version_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_media_items_v"
        ADD CONSTRAINT "_media_items_v_version_image_id_media_id_fk"
        FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_media_items_v"
        ADD CONSTRAINT "_media_items_v_version_podcast_audio_media_id_media_id_fk"
        FOREIGN KEY ("version_podcast_audio_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_media_items_v"
        ADD CONSTRAINT "_media_items_v_version_video_video_media_id_media_id_fk"
        FOREIGN KEY ("version_video_video_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_media_items_v_rels"
        ADD CONSTRAINT "_media_items_v_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."_media_items_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_media_items_v_rels"
        ADD CONSTRAINT "_media_items_v_rels_media_categories_fk"
        FOREIGN KEY ("media_categories_id") REFERENCES "public"."media_categories"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_media_categories_fk"
        FOREIGN KEY ("media_categories_id") REFERENCES "public"."media_categories"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_media_items_fk"
        FOREIGN KEY ("media_items_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "media_categories_slug_idx" ON "media_categories" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "media_categories_updated_at_idx" ON "media_categories" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "media_categories_created_at_idx" ON "media_categories" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "media_items_thumbnail_idx" ON "media_items" USING btree ("thumbnail_id");
    CREATE INDEX IF NOT EXISTS "media_items_image_idx" ON "media_items" USING btree ("image_id");
    CREATE INDEX IF NOT EXISTS "media_items_podcast_podcast_audio_media_idx" ON "media_items" USING btree ("podcast_audio_media_id");
    CREATE INDEX IF NOT EXISTS "media_items_video_video_video_media_idx" ON "media_items" USING btree ("video_video_media_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "media_items_slug_idx" ON "media_items" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "media_items_updated_at_idx" ON "media_items" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "media_items_created_at_idx" ON "media_items" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "media_items__status_idx" ON "media_items" USING btree ("_status");
    CREATE INDEX IF NOT EXISTS "media_items_rels_order_idx" ON "media_items_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "media_items_rels_parent_idx" ON "media_items_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "media_items_rels_path_idx" ON "media_items_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "media_items_rels_media_categories_id_idx" ON "media_items_rels" USING btree ("media_categories_id");
    CREATE INDEX IF NOT EXISTS "_media_items_v_parent_idx" ON "_media_items_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_media_items_v_version_version_thumbnail_idx" ON "_media_items_v" USING btree ("version_thumbnail_id");
    CREATE INDEX IF NOT EXISTS "_media_items_v_version_version_image_idx" ON "_media_items_v" USING btree ("version_image_id");
    CREATE INDEX IF NOT EXISTS "_media_items_v_version_podcast_version_podcast_audio_med_idx" ON "_media_items_v" USING btree ("version_podcast_audio_media_id");
    CREATE INDEX IF NOT EXISTS "_media_items_v_version_video_version_video_video_media_idx" ON "_media_items_v" USING btree ("version_video_video_media_id");
    CREATE INDEX IF NOT EXISTS "_media_items_v_version_version_slug_idx" ON "_media_items_v" USING btree ("version_slug");
    CREATE INDEX IF NOT EXISTS "_media_items_v_version_version_updated_at_idx" ON "_media_items_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "_media_items_v_version_version_created_at_idx" ON "_media_items_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_media_items_v_version_version__status_idx" ON "_media_items_v" USING btree ("version__status");
    CREATE INDEX IF NOT EXISTS "_media_items_v_created_at_idx" ON "_media_items_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_media_items_v_updated_at_idx" ON "_media_items_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_media_items_v_latest_idx" ON "_media_items_v" USING btree ("latest");
    CREATE INDEX IF NOT EXISTS "_media_items_v_autosave_idx" ON "_media_items_v" USING btree ("autosave");
    CREATE INDEX IF NOT EXISTS "_media_items_v_rels_order_idx" ON "_media_items_v_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_media_items_v_rels_parent_idx" ON "_media_items_v_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_media_items_v_rels_path_idx" ON "_media_items_v_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "_media_items_v_rels_media_categories_id_idx" ON "_media_items_v_rels" USING btree ("media_categories_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("media_categories_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_items_id_idx" ON "payload_locked_documents_rels" USING btree ("media_items_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_media_categories_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_media_items_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_media_categories_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_media_items_id_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "media_categories_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "media_items_id";

    DROP TABLE IF EXISTS "_media_items_v_rels" CASCADE;
    DROP TABLE IF EXISTS "_media_items_v" CASCADE;
    DROP TABLE IF EXISTS "media_items_rels" CASCADE;
    DROP TABLE IF EXISTS "media_items" CASCADE;
    DROP TABLE IF EXISTS "media_categories" CASCADE;

    DROP TYPE IF EXISTS "public"."enum__media_items_v_version_status";
    DROP TYPE IF EXISTS "public"."enum__media_items_v_version_video_source_type";
    DROP TYPE IF EXISTS "public"."enum__media_items_v_version_type";
    DROP TYPE IF EXISTS "public"."enum_media_items_status";
    DROP TYPE IF EXISTS "public"."enum_media_items_video_source_type";
    DROP TYPE IF EXISTS "public"."enum_media_items_type";
  `)
}
