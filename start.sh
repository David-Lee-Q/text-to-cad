#!/usr/bin/env bash
# CAD Viewer 生产服务启动脚本（端口固定 4178）
# 已启动 -> exit 0；启动成功 -> exit 0；启动失败 -> exit 2

set -u

HOST="127.0.0.1"
PORT="4178"
ROOT_DIR="/workspace/models"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${APP_DIR}/server.log"

# 已启动校验：端口已被 node 进程监听则直接返回 0
if ss -tlnp 2>&1 | grep -E ":${PORT} " | grep -q node; then
  exit 0
fi

# 显式 export 环境变量（避免 nohup 前置赋值被当作命令名执行）
export VIEWER_CAD_PYTHON="/root/.venvs/cad-skill/bin/python"
export VIEWER_CAD_PYTHONPATH="${APP_DIR}/packages/cadpy/src"
export VIEWER_AGENT_START_MODE="serve"
export NODE_OPTIONS="--max-old-space-size=1024"

cd "${APP_DIR}"

nohup node backend/server.mjs \
  --host "${HOST}" \
  --port "${PORT}" \
  --dir "${ROOT_DIR}" \
  >> "${LOG_FILE}" 2>&1 &

# 有限轮询等待端口就绪（不包裹 timeout，服务进程常驻）
for attempt in $(seq 1 40); do
  CODE="$(curl -s -o /dev/null --max-time 2 -w "%{http_code}" "http://${HOST}:${PORT}/")"
  if [ "${CODE}" = "200" ]; then
    exit 0
  fi
  sleep 0.5
done

# 启动失败：清理残留进程后返回 2
STARTED_PIDS="$(ss -tlnp 2>&1 | grep ":${PORT} " | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u)"
if [ -n "${STARTED_PIDS}" ]; then
  kill ${STARTED_PIDS} 2>&1 || true
fi
exit 2
