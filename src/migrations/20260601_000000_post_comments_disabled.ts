import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Per-post "tắt bình luận" toggle. Adds `comments_disabled` to the published
 * `posts` table and `version_comments_disabled` to the drafts/version table.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "comments_disabled" boolean DEFAULT false;
  `)
  await db.execute(sql`
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_comments_disabled" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "posts" DROP COLUMN IF EXISTS "comments_disabled";`)
  await db.execute(sql`ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_comments_disabled";`)
}
