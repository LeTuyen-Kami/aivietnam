-- Dedupe duplicate relationship rows in posts_rels (live data).
--
-- Background: a 100ms autosave interval (now raised to 800ms in the collection
-- configs) raced autosave writes against Postgres' many-to-many rels table and
-- inserted duplicate relatedPosts / categories / authors rows for the same post.
--
-- A duplicate = same (parent_id, path, relationship target) appearing more than
-- once. We keep the row with the smallest id in each group and delete the rest.
--
-- SAFE TO RE-RUN: idempotent — once duplicates are gone it deletes nothing.
-- TARGET DB: aivietnam @ localhost:5433 (prod, via SSH tunnel). Open the tunnel first.
--
-- Run:  psql "$DATABASE_URL" -f scripts/dedupe-posts-rels.sql

\echo '=== BEFORE: duplicate groups in posts_rels ==='
SELECT path, COUNT(*) AS dup_groups, SUM(c) AS extra_rows
FROM (
  SELECT parent_id, path,
         COALESCE(posts_id, 0)  AS t_posts,
         COALESCE(categories_id, 0) AS t_cats,
         COALESCE(users_id, 0)  AS t_users,
         COUNT(*) - 1 AS c
  FROM posts_rels
  GROUP BY parent_id, path, t_posts, t_cats, t_users
  HAVING COUNT(*) > 1
) d
GROUP BY path
ORDER BY extra_rows DESC;

BEGIN;

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY parent_id, path,
             COALESCE(posts_id, 0),
             COALESCE(categories_id, 0),
             COALESCE(users_id, 0),
             COALESCE(media_id, 0),
             COALESCE(media_gifs_id, 0)
           ORDER BY id
         ) AS rn
  FROM posts_rels
)
DELETE FROM posts_rels
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Review the row count above. COMMIT to apply, or ROLLBACK to abort.
COMMIT;

\echo '=== AFTER: duplicate groups in posts_rels (should be empty) ==='
SELECT path, COUNT(*) AS dup_groups, SUM(c) AS extra_rows
FROM (
  SELECT parent_id, path,
         COALESCE(posts_id, 0)  AS t_posts,
         COALESCE(categories_id, 0) AS t_cats,
         COALESCE(users_id, 0)  AS t_users,
         COUNT(*) - 1 AS c
  FROM posts_rels
  GROUP BY parent_id, path, t_posts, t_cats, t_users
  HAVING COUNT(*) > 1
) d
GROUP BY path
ORDER BY extra_rows DESC;
