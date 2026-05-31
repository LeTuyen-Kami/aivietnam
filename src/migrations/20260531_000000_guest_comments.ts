import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Allow guests (not logged in) to comment and react.
 *
 * - `comments.author_id` becomes nullable; guests are identified by
 *   `guest_id` (cookie) and shown via `guest_name`.
 * - `comment_likes.user_id` becomes nullable; guest reactions are keyed on
 *   `guest_id`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "comments" ALTER COLUMN "author_id" DROP NOT NULL;`)
  await db.execute(sql`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "guest_name" varchar;`)
  await db.execute(sql`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "guest_id" varchar;`)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "comments_guest_id_idx" ON "comments" USING btree ("guest_id");
  `)

  await db.execute(sql`ALTER TABLE "comment_likes" ALTER COLUMN "user_id" DROP NOT NULL;`)
  await db.execute(sql`ALTER TABLE "comment_likes" ADD COLUMN IF NOT EXISTS "guest_id" varchar;`)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "comment_likes_guest_id_idx" ON "comment_likes" USING btree ("guest_id");
  `)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "comment_likes_comment_guest_unique"
      ON "comment_likes" USING btree ("comment_id", "guest_id") WHERE "guest_id" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS "comment_likes_comment_guest_unique";`)
  await db.execute(sql`DROP INDEX IF EXISTS "comment_likes_guest_id_idx";`)
  await db.execute(sql`ALTER TABLE "comment_likes" DROP COLUMN IF EXISTS "guest_id";`)

  await db.execute(sql`DROP INDEX IF EXISTS "comments_guest_id_idx";`)
  await db.execute(sql`ALTER TABLE "comments" DROP COLUMN IF EXISTS "guest_id";`)
  await db.execute(sql`ALTER TABLE "comments" DROP COLUMN IF EXISTS "guest_name";`)
  // Note: author_id / user_id are left nullable on rollback because guest rows
  // (NULL author) may exist; restoring NOT NULL would fail without a backfill.
}
