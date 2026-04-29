import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_roles_collection_permissions_collection" AS ENUM('pages', 'posts', 'media', 'media-gifs', 'categories', 'listing-categories', 'listings', 'comment-moderation-rules', 'comments', 'comment-likes', 'livestreams', 'livestream-chat-messages', 'livestream-chat-event-receipts', 'audit-logs', 'users');
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('create', 'update', 'delete', 'globalUpdate');
  CREATE TYPE "public"."enum_audit_logs_entity_type" AS ENUM('collection', 'global');
  ALTER TYPE "public"."enum_payload_folders_folder_type" ADD VALUE 'media-gifs';
  CREATE TABLE "media_gifs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "roles_collection_permissions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"collection" "enum_roles_collection_permissions_collection" NOT NULL,
  	"create" boolean DEFAULT false,
  	"read" boolean DEFAULT true,
  	"update" boolean DEFAULT false,
  	"delete" boolean DEFAULT false
  );
  
  CREATE TABLE "roles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" "enum_audit_logs_action" NOT NULL,
  	"entity_type" "enum_audit_logs_entity_type" NOT NULL,
  	"entity" varchar NOT NULL,
  	"document_id" varchar,
  	"actor_id" integer,
  	"actor_name_snapshot" varchar,
  	"actor_email_snapshot" varchar,
  	"changed_fields" jsonb,
  	"request_meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pages_blocks_featured_posts_side_media" DROP CONSTRAINT "pages_blocks_featured_posts_side_media_small_row_promo_image_id_media_id_fk";
  
  ALTER TABLE "pages_blocks_featured_posts_side_media" DROP CONSTRAINT "pages_blocks_featured_posts_side_media_side_media_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_featured_posts_side_media" DROP CONSTRAINT "_pages_v_blocks_featured_posts_side_media_small_row_promo_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_featured_posts_side_media" DROP CONSTRAINT "_pages_v_blocks_featured_posts_side_media_side_media_id_media_id_fk";
  
  DROP INDEX "pages_blocks_featured_posts_side_media_small_row_promo_i_idx";
  DROP INDEX "pages_blocks_featured_posts_side_media_side_media_idx";
  DROP INDEX "_pages_v_blocks_featured_posts_side_media_small_row_prom_idx";
  DROP INDEX "_pages_v_blocks_featured_posts_side_media_side_media_idx";
  DROP INDEX "media_sizes_square_sizes_square_filename_idx";
  DROP INDEX "media_sizes_small_sizes_small_filename_idx";
  DROP INDEX "media_sizes_medium_sizes_medium_filename_idx";
  DROP INDEX "media_sizes_xlarge_sizes_xlarge_filename_idx";
  ALTER TABLE "pages_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "media_gifs_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "media_gifs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_gifs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "roles_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_logs_id" integer;
  ALTER TABLE "media_gifs" ADD CONSTRAINT "media_gifs_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "roles_collection_permissions" ADD CONSTRAINT "roles_collection_permissions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "media_gifs_folder_idx" ON "media_gifs" USING btree ("folder_id");
  CREATE INDEX "media_gifs_updated_at_idx" ON "media_gifs" USING btree ("updated_at");
  CREATE INDEX "media_gifs_created_at_idx" ON "media_gifs" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_gifs_filename_idx" ON "media_gifs" USING btree ("filename");
  CREATE INDEX "roles_collection_permissions_order_idx" ON "roles_collection_permissions" USING btree ("_order");
  CREATE INDEX "roles_collection_permissions_parent_id_idx" ON "roles_collection_permissions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "roles_key_idx" ON "roles" USING btree ("key");
  CREATE INDEX "roles_updated_at_idx" ON "roles" USING btree ("updated_at");
  CREATE INDEX "roles_created_at_idx" ON "roles" USING btree ("created_at");
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs" USING btree ("entity_type");
  CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity");
  CREATE INDEX "audit_logs_document_id_idx" ON "audit_logs" USING btree ("document_id");
  CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_gifs_fk" FOREIGN KEY ("media_gifs_id") REFERENCES "public"."media_gifs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_gifs_fk" FOREIGN KEY ("media_gifs_id") REFERENCES "public"."media_gifs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_gifs_fk" FOREIGN KEY ("media_gifs_id") REFERENCES "public"."media_gifs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_roles_fk" FOREIGN KEY ("roles_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX "pages_rels_media_gifs_id_idx" ON "pages_rels" USING btree ("media_gifs_id");
  CREATE INDEX "_pages_v_rels_media_id_idx" ON "_pages_v_rels" USING btree ("media_id");
  CREATE INDEX "_pages_v_rels_media_gifs_id_idx" ON "_pages_v_rels" USING btree ("media_gifs_id");
  CREATE INDEX "payload_locked_documents_rels_media_gifs_id_idx" ON "payload_locked_documents_rels" USING btree ("media_gifs_id");
  CREATE INDEX "payload_locked_documents_rels_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("roles_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  ALTER TABLE "pages_blocks_featured_posts_side_media" DROP COLUMN "small_row_promo_image_id";
  ALTER TABLE "pages_blocks_featured_posts_side_media" DROP COLUMN "side_media_id";
  ALTER TABLE "_pages_v_blocks_featured_posts_side_media" DROP COLUMN "small_row_promo_image_id";
  ALTER TABLE "_pages_v_blocks_featured_posts_side_media" DROP COLUMN "side_media_id";
  ALTER TABLE "media" DROP COLUMN "sizes_square_url";
  ALTER TABLE "media" DROP COLUMN "sizes_square_width";
  ALTER TABLE "media" DROP COLUMN "sizes_square_height";
  ALTER TABLE "media" DROP COLUMN "sizes_square_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_square_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_square_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_small_url";
  ALTER TABLE "media" DROP COLUMN "sizes_small_width";
  ALTER TABLE "media" DROP COLUMN "sizes_small_height";
  ALTER TABLE "media" DROP COLUMN "sizes_small_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_small_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_small_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_url";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_width";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_height";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_medium_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_xlarge_url";
  ALTER TABLE "media" DROP COLUMN "sizes_xlarge_width";
  ALTER TABLE "media" DROP COLUMN "sizes_xlarge_height";
  ALTER TABLE "media" DROP COLUMN "sizes_xlarge_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_xlarge_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_xlarge_filename";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media_gifs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "roles_collection_permissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "media_gifs" CASCADE;
  DROP TABLE "roles_collection_permissions" CASCADE;
  DROP TABLE "roles" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_media_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_media_gifs_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_media_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_media_gifs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_media_gifs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_roles_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_logs_fk";
  
  ALTER TABLE "payload_folders_folder_type" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_folders_folder_type";
  CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media');
  ALTER TABLE "payload_folders_folder_type" ALTER COLUMN "value" SET DATA TYPE "public"."enum_payload_folders_folder_type" USING "value"::"public"."enum_payload_folders_folder_type";
  DROP INDEX "pages_rels_media_id_idx";
  DROP INDEX "pages_rels_media_gifs_id_idx";
  DROP INDEX "_pages_v_rels_media_id_idx";
  DROP INDEX "_pages_v_rels_media_gifs_id_idx";
  DROP INDEX "payload_locked_documents_rels_media_gifs_id_idx";
  DROP INDEX "payload_locked_documents_rels_roles_id_idx";
  DROP INDEX "payload_locked_documents_rels_audit_logs_id_idx";
  ALTER TABLE "pages_blocks_featured_posts_side_media" ADD COLUMN "small_row_promo_image_id" integer;
  ALTER TABLE "pages_blocks_featured_posts_side_media" ADD COLUMN "side_media_id" integer;
  ALTER TABLE "_pages_v_blocks_featured_posts_side_media" ADD COLUMN "small_row_promo_image_id" integer;
  ALTER TABLE "_pages_v_blocks_featured_posts_side_media" ADD COLUMN "side_media_id" integer;
  ALTER TABLE "media" ADD COLUMN "sizes_square_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_square_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_square_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_square_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_square_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_square_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_small_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_small_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_small_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_small_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_small_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_small_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_filename" varchar;
  ALTER TABLE "pages_blocks_featured_posts_side_media" ADD CONSTRAINT "pages_blocks_featured_posts_side_media_small_row_promo_image_id_media_id_fk" FOREIGN KEY ("small_row_promo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_posts_side_media" ADD CONSTRAINT "pages_blocks_featured_posts_side_media_side_media_id_media_id_fk" FOREIGN KEY ("side_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_posts_side_media" ADD CONSTRAINT "_pages_v_blocks_featured_posts_side_media_small_row_promo_image_id_media_id_fk" FOREIGN KEY ("small_row_promo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_posts_side_media" ADD CONSTRAINT "_pages_v_blocks_featured_posts_side_media_side_media_id_media_id_fk" FOREIGN KEY ("side_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_featured_posts_side_media_small_row_promo_i_idx" ON "pages_blocks_featured_posts_side_media" USING btree ("small_row_promo_image_id");
  CREATE INDEX "pages_blocks_featured_posts_side_media_side_media_idx" ON "pages_blocks_featured_posts_side_media" USING btree ("side_media_id");
  CREATE INDEX "_pages_v_blocks_featured_posts_side_media_small_row_prom_idx" ON "_pages_v_blocks_featured_posts_side_media" USING btree ("small_row_promo_image_id");
  CREATE INDEX "_pages_v_blocks_featured_posts_side_media_side_media_idx" ON "_pages_v_blocks_featured_posts_side_media" USING btree ("side_media_id");
  CREATE INDEX "media_sizes_square_sizes_square_filename_idx" ON "media" USING btree ("sizes_square_filename");
  CREATE INDEX "media_sizes_small_sizes_small_filename_idx" ON "media" USING btree ("sizes_small_filename");
  CREATE INDEX "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
  CREATE INDEX "media_sizes_xlarge_sizes_xlarge_filename_idx" ON "media" USING btree ("sizes_xlarge_filename");
  ALTER TABLE "pages_rels" DROP COLUMN "media_id";
  ALTER TABLE "pages_rels" DROP COLUMN "media_gifs_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "media_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "media_gifs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_gifs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "roles_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_logs_id";
  DROP TYPE "public"."enum_roles_collection_permissions_collection";
  DROP TYPE "public"."enum_audit_logs_action";
  DROP TYPE "public"."enum_audit_logs_entity_type";`)
}
