#!/usr/bin/env bash
#
# Mở SSH tunnel tới Postgres PROD (VPS) rồi chạy lệnh dev truyền vào (vd next dev).
# Tunnel: local 5433 -> VPS 127.0.0.1:5432 (container aivietnam-db).
# Tự đóng tunnel khi dev dừng (Ctrl-C). Nếu cổng đã mở sẵn thì dùng lại.
#
# Dùng qua: `pnpm dev` (package.json gọi script này). Bỏ tunnel: `pnpm dev:no-tunnel`.
# ⚠️  DB này là PROD — mọi thao tác local ảnh hưởng data thật.
set -euo pipefail

LOCAL_PORT="${DB_TUNNEL_LOCAL_PORT:-5433}"
SERVER="${DB_TUNNEL_SERVER:-root@180.93.2.175}"

if lsof -nP -iTCP:"${LOCAL_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[dev] DB tunnel cổng ${LOCAL_PORT} đã mở sẵn — dùng lại."
else
  echo "[dev] Mở SSH tunnel localhost:${LOCAL_PORT} -> ${SERVER}:5432 (prod DB)..."
  ssh -N -L "${LOCAL_PORT}:localhost:5432" "${SERVER}" &
  TUNNEL_PID=$!
  trap 'kill "${TUNNEL_PID}" 2>/dev/null || true' EXIT
  for _ in $(seq 1 25); do
    nc -z localhost "${LOCAL_PORT}" >/dev/null 2>&1 && break
    sleep 0.3
  done
  echo "[dev] Tunnel sẵn sàng."
fi

# Chạy lệnh dev (không exec để trap EXIT còn đóng được tunnel khi dev thoát).
"$@"
