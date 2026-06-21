import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Per-post "Hiển thị trên thiết bị" (segmented multi-select). Adds 3 boolean
 * columns to the published `posts` table and their `version_*` counterparts on
 * the drafts/version table `_posts_v`. Default true → bài cũ vẫn hiển thị mọi nơi.
 * Dùng để lọc feed "latest" ở cột trái block Portal - 2 column.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "display_on_mobile" boolean DEFAULT true;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "display_on_tablet" boolean DEFAULT true;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "display_on_desktop" boolean DEFAULT true;
  `)
  await db.execute(sql`
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_display_on_mobile" boolean DEFAULT true;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_display_on_tablet" boolean DEFAULT true;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_display_on_desktop" boolean DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "display_on_mobile";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "display_on_tablet";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "display_on_desktop";
  `)
  await db.execute(sql`
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_display_on_mobile";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_display_on_tablet";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_display_on_desktop";
  `)
}
