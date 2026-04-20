import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "comments"
      ADD COLUMN IF NOT EXISTS "parent_comment_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "comments"
        ADD CONSTRAINT "comments_parent_comment_id_comments_id_fk"
        FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "comments_parent_comment_idx"
      ON "comments" USING btree ("parent_comment_id");
  `)

  await db.execute(sql`
    ALTER TABLE "comment_likes"
      ADD COLUMN IF NOT EXISTS "reaction" varchar DEFAULT 'like' NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "comments"
      DROP CONSTRAINT IF EXISTS "comments_parent_comment_id_comments_id_fk";
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "comments_parent_comment_idx";
  `)
  await db.execute(sql`
    ALTER TABLE "comments" DROP COLUMN IF EXISTS "parent_comment_id";
  `)
  await db.execute(sql`
    ALTER TABLE "comment_likes" DROP COLUMN IF EXISTS "reaction";
  `)
}
