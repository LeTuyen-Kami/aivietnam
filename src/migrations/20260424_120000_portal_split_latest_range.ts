import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      block_table record;
    BEGIN
      FOR block_table IN
        SELECT c.table_schema, c.table_name
        FROM information_schema.columns c
        WHERE c.column_name = 'left_latest_limit'
          AND EXISTS (
            SELECT 1
            FROM information_schema.columns left_source_column
            WHERE left_source_column.table_schema = c.table_schema
              AND left_source_column.table_name = c.table_name
              AND left_source_column.column_name = 'left_source'
          )
      LOOP
        EXECUTE format(
          'ALTER TABLE %I.%I
            ADD COLUMN IF NOT EXISTS left_latest_from numeric,
            ADD COLUMN IF NOT EXISTS left_latest_to numeric',
          block_table.table_schema,
          block_table.table_name
        );

        EXECUTE format(
          'UPDATE %I.%I
            SET
              left_latest_from = COALESCE(left_latest_from, 1),
              left_latest_to = COALESCE(left_latest_to, left_latest_limit, 8)
            WHERE left_latest_from IS NULL
              OR left_latest_to IS NULL',
          block_table.table_schema,
          block_table.table_name
        );
      END LOOP;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      block_table record;
    BEGIN
      FOR block_table IN
        SELECT c.table_schema, c.table_name
        FROM information_schema.columns c
        WHERE c.column_name IN ('left_latest_from', 'left_latest_to')
          AND EXISTS (
            SELECT 1
            FROM information_schema.columns left_source_column
            WHERE left_source_column.table_schema = c.table_schema
              AND left_source_column.table_name = c.table_name
              AND left_source_column.column_name = 'left_source'
          )
        GROUP BY c.table_schema, c.table_name
      LOOP
        EXECUTE format(
          'ALTER TABLE %I.%I
            DROP COLUMN IF EXISTS left_latest_from,
            DROP COLUMN IF EXISTS left_latest_to',
          block_table.table_schema,
          block_table.table_name
        );
      END LOOP;
    END $$;
  `)
}
