import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" serial PRIMARY KEY NOT NULL,
      "collection" varchar,
      "action" varchar,
      "document_id" varchar,
      "timestamp" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "user_id" integer,
      "changes" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "collection" varchar;
  `)
  await db.execute(sql`
    ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "action" varchar;
  `)
  await db.execute(sql`
    ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "document_id" varchar;
  `)
  await db.execute(sql`
    ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "timestamp" timestamp(3) with time zone DEFAULT now() NOT NULL;
  `)
  await db.execute(sql`
    ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "user_id" integer;
  `)
  await db.execute(sql`
    ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "changes" jsonb;
  `)
  await db.execute(sql`
    ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL;
  `)
  await db.execute(sql`
    ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "audit_logs"
        ADD CONSTRAINT "audit_logs_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"
      ON "audit_logs" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "audit_logs_created_at_idx";
  `)
  await db.execute(sql`
    ALTER TABLE "audit_logs"
      DROP CONSTRAINT IF EXISTS "audit_logs_user_id_users_id_fk";
  `)
}
