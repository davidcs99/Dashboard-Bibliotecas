#!/bin/sh
set -e

redis-server --appendonly yes --dir /app/redis-data --port 6379 --bind 127.0.0.1 &

for attempt in $(seq 1 20); do
  if redis-cli -h 127.0.0.1 ping >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

exec node server.js
