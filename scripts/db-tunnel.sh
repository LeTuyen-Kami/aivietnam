#!/usr/bin/env bash
#
# Mở SSH tunnel tới Postgres PROD trên VPS (Postgres bind 127.0.0.1:5432 trên server).
# Local  localhost:5433  ->  VPS  localhost:5432  (container aivietnam-db).
#
# Dùng: mở 1 terminal chạy `bash scripts/db-tunnel.sh` và GIỮ MỞ khi dev.
# Khi đó .env (DATABASE_URL=...@localhost:5433/...) sẽ kết nối được prod DB.
# Ctrl-C để đóng tunnel.
#
# ⚠️  Tunnel này trỏ vào DATABASE THẬT của site. Mọi ghi/xoá/migrate đều ảnh hưởng prod.
set -euo pipefail

SERVER="${DB_TUNNEL_SERVER:-root@180.93.2.175}"
LOCAL_PORT="${DB_TUNNEL_LOCAL_PORT:-5433}"

echo "Mở tunnel localhost:${LOCAL_PORT} -> ${SERVER}:5432 (prod Postgres). Ctrl-C để dừng."
exec ssh -N -L "${LOCAL_PORT}:localhost:5432" "${SERVER}"
