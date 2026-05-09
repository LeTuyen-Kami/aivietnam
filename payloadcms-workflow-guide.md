# PayloadCMS + Postgres + Media Workflow

## Mục tiêu

Tách biệt hoàn toàn:

- local development
- production VPS

để tránh:
- mất media
- lệch DB
- migrate lỗi
- phá production khi dev local

---

# Kiến trúc đúng

## Local

- local postgres
- local media folder

```txt
LOCAL
 ├── app
 ├── postgres local
 └── media/
```

---

## Production VPS

- production postgres
- production media persistent

```txt
VPS
 ├── app
 ├── production postgres
 └── /opt/payload/media
```

---

# Không được làm

## Shared DB + separate local media

Ví dụ:

```txt
local app  ---> shared prod DB
vps app    ---> shared prod DB
```

nhưng:

```txt
local media != vps media
```

=> sẽ sinh:
- media 404
- relation lỗi
- orphan records
- foreign key fail

---

# Media hoạt động như nào

Payload upload gồm:

1. Row trong bảng `media`
2. File thật trong filesystem

Ví dụ:

```txt
DB:
media.id = 154
filename = hero.webp
```

và:

```txt
Filesystem:
media/hero.webp
```

Thiếu một trong hai sẽ lỗi.

---

# Lỗi foreign key thường gặp

Ví dụ lỗi:

```txt
Key (small_row_promo_image_id)=(154) is not present in table "media"
```

Nghĩa là:

```txt
page đang reference media id 154
```

nhưng:

```txt
media.id = 154
```

không tồn tại.

---

# Nguyên nhân thường gặp

- xóa media thủ công
- restore DB thiếu media table
- shared DB giữa local/VPS
- reset media collection
- migrate lệch schema
- xóa file/media tùm lum

---

# Fix orphan relation

## Xem record lỗi

```sql
SELECT *
FROM "_pages_v_blocks_featured_posts_side_media"
WHERE "small_row_promo_image_id" NOT IN (
  SELECT "id" FROM "media"
);
```

---

## Set relation chết thành NULL

```sql
UPDATE "_pages_v_blocks_featured_posts_side_media"
SET "small_row_promo_image_id" = NULL
WHERE "small_row_promo_image_id" NOT IN (
  SELECT "id" FROM "media"
);
```

---

# Setup local postgres

## Restore Neon về local

### Dump từ Neon

```bash
pg_dump 'postgresql://USER:PASSWORD@HOST/DB?sslmode=require' > dump.sql
```

---

### Restore local

```bash
psql -U letuyen -d letuyen < dump.sql
```

---

# Lỗi thường gặp khi restore

## neon_superuser does not exist

Có thể ignore.

Do Neon có internal role:

```txt
neon_superuser
```

không tồn tại ở local.

Không ảnh hưởng app.

---

# DATABASE_URI local đúng

## Sai

```env
DATABASE_URI=postgresql://user:pass@base:5432/db
```

`base` thường là docker hostname.

---

## Đúng

```env
DATABASE_URI=postgresql://letuyen@localhost:5432/letuyen
```

hoặc:

```env
DATABASE_URI=postgresql://postgres:password@localhost:5432/letuyen
```

---

# Workflow migrate chuẩn

## 1. Dev local

Sửa:
- collection
- field
- relation

---

## 2. Test local

```bash
pnpm dev
```

Đảm bảo schema chạy OK.

---

## 3. Create migration

```bash
pnpm payload migrate:create
```

Payload sẽ diff:

```txt
code schema
VS
current DB schema
```

rồi generate migration.

---

## 4. Commit migration

Commit:
- code
- migration files

---

## 5. Deploy production

```bash
git pull
pnpm install
pnpm build
```

---

## 6. Run migration production

```bash
pnpm payload migrate
```

---

## 7. Restart app

```bash
pm2 restart app
```

hoặc restart docker container.

---

# Deploy flow thực tế

## PM2

```bash
git pull
pnpm install
pnpm build
pnpm payload migrate
pm2 restart app
```

---

## Docker

```yaml
command: sh -c "pnpm payload migrate && pnpm start"
```

---

# Thứ nguy hiểm nhất

## Không phải thêm field mới

Thêm field mới thường an toàn.

---

## Nguy hiểm là:

- đổi field type
- rename field
- delete field
- relation changes

có thể gây:
- data loss
- migrate fail
- production crash

---

# Backup trước migrate

Rất nên làm:

```bash
pg_dump 'DATABASE_URL' > backup.sql
```

trước khi deploy production.

---

# Media production chuẩn

## Option 1 — Host volume

```yaml
volumes:
  - /opt/payload/media:/app/media
```

---

## Option 2 — R2/S3

Khuyên dùng khi project lớn hơn.

Ví dụ:
- Cloudflare R2
- Amazon S3

Ưu điểm:
- không mất media khi redeploy
- nhiều server dùng chung
- scale dễ

---

# Rule quan trọng nhất

## Không share production DB với local dev.

```txt
GOOD:
local DB != prod DB
```

```txt
BAD:
local app ---> prod DB
```

---

# Khi nào có thể "kệ"

Nếu lỗi chỉ là:

```txt
foreign key media missing
```

thì thường:
- không corrupt DB
- không mất toàn bộ data
- chỉ vài image relation bị chết

Có thể:
- set NULL
- upload lại ảnh
- cleanup sau
