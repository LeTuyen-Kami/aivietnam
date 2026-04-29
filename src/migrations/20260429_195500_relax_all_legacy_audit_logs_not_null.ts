import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      legacy_col text;
      legacy_cols text[] := ARRAY[
        'entity',
        'entity_type',
        'entity_id',
        'actor',
        'actor_id',
        'metadata',
        'data'
      ];
    BEGIN
      FOREACH legacy_col IN ARRAY legacy_cols LOOP
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'audit_logs'
            AND column_name = legacy_col
        ) THEN
          EXECUTE format('ALTER TABLE "audit_logs" ALTER COLUMN %I DROP NOT NULL', legacy_col);
        END IF;
      END LOOP;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    SELECT 1;
  `)
}
