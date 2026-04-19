import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Incremental migration for `livestreams` only. The initial `migrate:create` run
 * generated a full-schema snapshot (unsuitable for a brownfield DB already synced
 * via dev push). This file matches Payload’s expected table/column shapes for
 * the Livestreams collection.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_livestreams_status" AS ENUM('draft', 'scheduled', 'live', 'ended');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "livestreams" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "status" "enum_livestreams_status" NOT NULL,
      "call_id" varchar NOT NULL,
      "call_type" varchar DEFAULT 'livestream' NOT NULL,
      "description" varchar,
      "scheduled_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "livestreams_slug_idx" ON "livestreams" USING btree ("slug");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestreams_updated_at_idx" ON "livestreams" USING btree ("updated_at");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "livestreams_created_at_idx" ON "livestreams" USING btree ("created_at");
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "livestreams_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_livestreams_fk"
        FOREIGN KEY ("livestreams_id") REFERENCES "public"."livestreams"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_livestreams_id_idx"
      ON "payload_locked_documents_rels" USING btree ("livestreams_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_livestreams_fk";
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "livestreams_id";
  `)
  await db.execute(sql`DROP INDEX IF EXISTS "payload_locked_documents_rels_livestreams_id_idx";`)
  await db.execute(sql`DROP TABLE IF EXISTS "livestreams";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_livestreams_status";`)
}
