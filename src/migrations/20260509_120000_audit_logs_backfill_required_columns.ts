import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Backfills nullable audit_logs rows so Payload can enforce NOT NULL on required fields.
 * Legacy rows may have empty `collection` while still carrying `entity`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
      ) THEN

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'entity'
      ) THEN
        EXECUTE $u$
          UPDATE "audit_logs"
          SET "collection" = COALESCE(
            NULLIF(TRIM("collection"), ''),
            NULLIF(TRIM("entity"), ''),
            'unknown'
          )
          WHERE "collection" IS NULL
            OR NULLIF(TRIM("collection"), '') IS NULL
        $u$;
      ELSIF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'collection'
      ) THEN
        EXECUTE $u$
          UPDATE "audit_logs"
          SET "collection" = COALESCE(NULLIF(TRIM("collection"), ''), 'unknown')
          WHERE "collection" IS NULL
            OR NULLIF(TRIM("collection"), '') IS NULL
        $u$;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'document_id'
      ) THEN
        EXECUTE $u$
          UPDATE "audit_logs"
          SET "document_id" = COALESCE(
            NULLIF(TRIM("document_id"), ''),
            'legacy-' || id::text
          )
          WHERE "document_id" IS NULL
            OR NULLIF(TRIM("document_id"), '') IS NULL
        $u$;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'action'
          AND udt_name = 'enum_audit_logs_action'
      ) THEN
        EXECUTE $u$
          UPDATE "audit_logs"
          SET "action" = COALESCE("action", 'update'::enum_audit_logs_action)
          WHERE "action" IS NULL
        $u$;
      ELSIF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'action'
      ) THEN
        EXECUTE $u$
          UPDATE "audit_logs"
          SET "action" = COALESCE(NULLIF(TRIM("action"::text), ''), 'update')
          WHERE "action" IS NULL
            OR NULLIF(TRIM("action"::text), '') IS NULL
        $u$;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'timestamp'
      ) THEN
        EXECUTE $u$
          UPDATE "audit_logs"
          SET "timestamp" = COALESCE("timestamp", "created_at", now()::timestamptz)
          WHERE "timestamp" IS NULL
        $u$;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'collection'
      ) THEN
        ALTER TABLE "audit_logs" ALTER COLUMN "collection" SET NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'document_id'
      ) THEN
        ALTER TABLE "audit_logs" ALTER COLUMN "document_id" SET NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'action'
      ) THEN
        ALTER TABLE "audit_logs" ALTER COLUMN "action" SET NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'timestamp'
      ) THEN
        ALTER TABLE "audit_logs" ALTER COLUMN "timestamp" SET NOT NULL;
      END IF;

      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
      ) THEN

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'timestamp'
      ) THEN
        ALTER TABLE "audit_logs" ALTER COLUMN "timestamp" DROP NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'action'
      ) THEN
        ALTER TABLE "audit_logs" ALTER COLUMN "action" DROP NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'document_id'
      ) THEN
        ALTER TABLE "audit_logs" ALTER COLUMN "document_id" DROP NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'collection'
      ) THEN
        ALTER TABLE "audit_logs" ALTER COLUMN "collection" DROP NOT NULL;
      END IF;

      END IF;
    END $$;
  `)
}
