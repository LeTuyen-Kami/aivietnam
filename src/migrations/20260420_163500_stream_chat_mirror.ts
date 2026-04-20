import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "livestreams"
      ADD COLUMN IF NOT EXISTS "chat_channel_cid" varchar;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestreams_chat_channel_cid_idx"
      ON "livestreams" USING btree ("chat_channel_cid");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "livestream_chat_messages" (
      "id" serial PRIMARY KEY NOT NULL,
      "stream_message_id" varchar NOT NULL,
      "channel_cid" varchar NOT NULL,
      "channel_type" varchar NOT NULL,
      "channel_id" varchar NOT NULL,
      "livestream_id" integer,
      "author_stream_user_id" varchar NOT NULL,
      "author_name" varchar,
      "text" varchar,
      "reaction_like_count" numeric DEFAULT 0,
      "created_at_stream" timestamp(3) with time zone NOT NULL,
      "updated_at_stream" timestamp(3) with time zone NOT NULL,
      "deleted_at" timestamp(3) with time zone,
      "raw_payload" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "livestream_chat_messages"
        ADD CONSTRAINT "livestream_chat_messages_livestream_id_livestreams_id_fk"
        FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "livestream_chat_messages_stream_message_id_idx"
      ON "livestream_chat_messages" USING btree ("stream_message_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestream_chat_messages_channel_cid_idx"
      ON "livestream_chat_messages" USING btree ("channel_cid");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestream_chat_messages_channel_id_idx"
      ON "livestream_chat_messages" USING btree ("channel_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestream_chat_messages_livestream_idx"
      ON "livestream_chat_messages" USING btree ("livestream_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestream_chat_messages_author_stream_user_id_idx"
      ON "livestream_chat_messages" USING btree ("author_stream_user_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestream_chat_messages_reaction_like_count_idx"
      ON "livestream_chat_messages" USING btree ("reaction_like_count");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestream_chat_messages_created_at_stream_idx"
      ON "livestream_chat_messages" USING btree ("created_at_stream");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestream_chat_messages_deleted_at_idx"
      ON "livestream_chat_messages" USING btree ("deleted_at");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "livestream_chat_event_receipts" (
      "id" serial PRIMARY KEY NOT NULL,
      "event_id" varchar NOT NULL,
      "event_type" varchar NOT NULL,
      "channel_cid" varchar,
      "processed_at" timestamp(3) with time zone NOT NULL,
      "raw_payload" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "livestream_chat_event_receipts_event_id_idx"
      ON "livestream_chat_event_receipts" USING btree ("event_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestream_chat_event_receipts_event_type_idx"
      ON "livestream_chat_event_receipts" USING btree ("event_type");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestream_chat_event_receipts_channel_cid_idx"
      ON "livestream_chat_event_receipts" USING btree ("channel_cid");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestream_chat_event_receipts_processed_at_idx"
      ON "livestream_chat_event_receipts" USING btree ("processed_at");
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "livestream_chat_messages_id" integer;
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "livestream_chat_event_receipts_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_livestream_chat_messages_fk"
        FOREIGN KEY ("livestream_chat_messages_id") REFERENCES "public"."livestream_chat_messages"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_livestream_chat_event_receipts_fk"
        FOREIGN KEY ("livestream_chat_event_receipts_id") REFERENCES "public"."livestream_chat_event_receipts"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_livestream_chat_messages_id_idx"
      ON "payload_locked_documents_rels" USING btree ("livestream_chat_messages_id");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_livestream_chat_event_receipts_id_idx"
      ON "payload_locked_documents_rels" USING btree ("livestream_chat_event_receipts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_livestream_chat_messages_fk";
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_livestream_chat_event_receipts_fk";
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "livestream_chat_messages_id";
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "livestream_chat_event_receipts_id";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_livestream_chat_messages_id_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_livestream_chat_event_receipts_id_idx";
  `)

  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_event_receipts_event_id_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_event_receipts_event_type_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_event_receipts_channel_cid_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_event_receipts_processed_at_idx";
  `)
  await db.execute(sql`
    DROP TABLE IF EXISTS "livestream_chat_event_receipts";
  `)

  await db.execute(sql`
    ALTER TABLE "livestream_chat_messages"
      DROP CONSTRAINT IF EXISTS "livestream_chat_messages_livestream_id_livestreams_id_fk";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_messages_stream_message_id_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_messages_channel_cid_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_messages_channel_id_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_messages_livestream_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_messages_author_stream_user_id_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_messages_reaction_like_count_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_messages_created_at_stream_idx";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestream_chat_messages_deleted_at_idx";
  `)
  await db.execute(sql`
    DROP TABLE IF EXISTS "livestream_chat_messages";
  `)

  await db.execute(sql`
    ALTER TABLE "livestreams" DROP COLUMN IF EXISTS "chat_channel_cid";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "livestreams_chat_channel_cid_idx";
  `)
}
