#!/bin/bash

echo "=== PM2 Cluster Status ==="
pm2 status

echo -e "\n=== Instance Count ==="
INSTANCE_COUNT=$(pm2 jlist 2>/dev/null | jq -r '[.[] | select(.name=="jblog-backend")] | length' 2>/dev/null || echo "0")
CPU_COUNT=$(nproc 2>/dev/null || echo "1")
echo "Instances: $INSTANCE_COUNT"
echo "CPU Cores: $CPU_COUNT"

if [ "$INSTANCE_COUNT" -eq "$CPU_COUNT" ] && [ "$INSTANCE_COUNT" -gt 1 ]; then
  echo "✅ Cluster mode working correctly!"
elif [ "$INSTANCE_COUNT" -eq 1 ]; then
  echo "⚠️  Only 1 instance found - cluster mode may not be enabled"
else
  echo "⚠️  Expected $CPU_COUNT instances, found $INSTANCE_COUNT"
fi

echo -e "\n=== Instance Details ==="
pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="jblog-backend") | "Instance \(.pm_id): PID \(.pid), Mode: \(.pm2_env.exec_mode // "N/A"), Instance ID: \(.pm2_env.instance_var // "N/A")"' 2>/dev/null || echo "Could not parse PM2 info"

echo -e "\n=== Testing Cluster Endpoint ==="
for i in {1..5}; do
  echo -n "Request $i: "
  RESPONSE=$(curl -s http://localhost:8000/api/cluster-info 2>/dev/null)
  if [ $? -eq 0 ]; then
    INSTANCE_ID=$(echo $RESPONSE | jq -r '.instanceId' 2>/dev/null || echo "N/A")
    PID=$(echo $RESPONSE | jq -r '.pid' 2>/dev/null || echo "N/A")
    echo "Instance ID: $INSTANCE_ID, PID: $PID"
  else
    echo "Failed to connect"
  fi
  sleep 0.5
done

echo -e "\n=== Redis Connection (if enabled) ==="
if command -v redis-cli &> /dev/null; then
  if redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "✅ Redis connected"
    echo "Redis clients:"
    redis-cli CLIENT LIST 2>/dev/null | grep -i jblog || echo "No JBlog clients found"
  else
    echo "❌ Redis not connected or not running"
  fi
else
  echo "⚠️  redis-cli not found"
fi

echo -e "\n=== PM2 Logs (last 10 lines) ==="
pm2 logs jblog-backend --lines 10 --nostream 2>/dev/null | tail -10 || echo "Could not fetch logs"

