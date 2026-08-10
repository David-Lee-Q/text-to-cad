#!/usr/bin/env bash
# CAD Viewer 生产服务停止脚本（端口固定 4178）
# 通过 ss 提取 PID 并 kill，不使用 fuser/lsof；stderr 保持可见

set -u

PORT="4178"

PIDS="$(ss -tlnp 2>&1 | grep ":${PORT} " | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u)"

if [ -z "${PIDS}" ]; then
  exit 0
fi

kill ${PIDS} 2>&1

# 有限轮询等待进程退出
for attempt in $(seq 1 20); do
  REMAINING="$(ss -tlnp 2>&1 | grep ":${PORT} " | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u)"
  if [ -z "${REMAINING}" ]; then
    exit 0
  fi
  sleep 0.3
done

# 超时仍有残留则强制终止
REMAINING="$(ss -tlnp 2>&1 | grep ":${PORT} " | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u)"
if [ -n "${REMAINING}" ]; then
  kill -9 ${REMAINING} 2>&1
fi

exit 0
