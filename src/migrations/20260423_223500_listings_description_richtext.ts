import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      listings_description_type text;
      listings_version_description_type text;
    BEGIN
      SELECT data_type
      INTO listings_description_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'listings'
        AND column_name = 'description';

      IF listings_description_type IN ('text', 'character varying') THEN
        EXECUTE $sql$
          ALTER TABLE "listings"
          ALTER COLUMN "description"
          SET DATA TYPE jsonb
          USING (
            CASE
              WHEN "description" IS NULL THEN NULL
              ELSE jsonb_build_object(
                'root',
                jsonb_build_object(
                  'type', 'root',
                  'children', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'paragraph',
                      'children', jsonb_build_array(
                        jsonb_build_object(
                          'type', 'text',
                          'text', "description",
                          'detail', 0,
                          'format', 0,
                          'mode', 'normal',
                          'style', '',
                          'version', 1
                        )
                      ),
                      'direction', NULL,
                      'format', '',
                      'indent', 0,
                      'textFormat', 0,
                      'textStyle', '',
                      'version', 1
                    )
                  ),
                  'direction', NULL,
                  'format', '',
                  'indent', 0,
                  'version', 1
                )
              )
            END
          )
        $sql$;
      END IF;

      SELECT data_type
      INTO listings_version_description_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '_listings_v'
        AND column_name = 'version_description';

      IF listings_version_description_type IN ('text', 'character varying') THEN
        EXECUTE $sql$
          ALTER TABLE "_listings_v"
          ALTER COLUMN "version_description"
          SET DATA TYPE jsonb
          USING (
            CASE
              WHEN "version_description" IS NULL THEN NULL
              ELSE jsonb_build_object(
                'root',
                jsonb_build_object(
                  'type', 'root',
                  'children', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'paragraph',
                      'children', jsonb_build_array(
                        jsonb_build_object(
                          'type', 'text',
                          'text', "version_description",
                          'detail', 0,
                          'format', 0,
                          'mode', 'normal',
                          'style', '',
                          'version', 1
                        )
                      ),
                      'direction', NULL,
                      'format', '',
                      'indent', 0,
                      'textFormat', 0,
                      'textStyle', '',
                      'version', 1
                    )
                  ),
                  'direction', NULL,
                  'format', '',
                  'indent', 0,
                  'version', 1
                )
              )
            END
          )
        $sql$;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      listings_description_type text;
      listings_version_description_type text;
    BEGIN
      SELECT data_type
      INTO listings_description_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'listings'
        AND column_name = 'description';

      IF listings_description_type = 'jsonb' THEN
        EXECUTE $sql$
          ALTER TABLE "listings"
          ALTER COLUMN "description"
          SET DATA TYPE text
          USING (
            CASE
              WHEN "description" IS NULL THEN NULL
              ELSE COALESCE(
                "description"->'root'->'children'->0->'children'->0->>'text',
                "description"::text
              )
            END
          )
        $sql$;
      END IF;

      SELECT data_type
      INTO listings_version_description_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '_listings_v'
        AND column_name = 'version_description';

      IF listings_version_description_type = 'jsonb' THEN
        EXECUTE $sql$
          ALTER TABLE "_listings_v"
          ALTER COLUMN "version_description"
          SET DATA TYPE text
          USING (
            CASE
              WHEN "version_description" IS NULL THEN NULL
              ELSE COALESCE(
                "version_description"->'root'->'children'->0->'children'->0->>'text',
                "version_description"::text
              )
            END
          )
        $sql$;
      END IF;
    END $$;
  `)
}
