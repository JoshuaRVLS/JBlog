#!/bin/bash

echo "=== Fixing Database Auth & Cluster Mode ==="

# 1. Cek DATABASE_URL
echo -e "\n1. Checking DATABASE_URL..."
cd /var/www/jblog/backend || cd backend

if [ -f .env ]; then
  echo "✅ .env file found"
  DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
  if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env"
    echo "Please add DATABASE_URL to .env file"
    exit 1
  else
    echo "DATABASE_URL found (hidden for security)"
  fi
else
  echo "❌ .env file not found"
  exit 1
fi

# 2. Test Database Connection
echo -e "\n2. Testing database connection..."
if command -v psql &> /dev/null; then
  if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection OK"
  else
    echo "❌ Database connection FAILED"
    echo ""
    echo "Please check:"
    echo "1. Database password is correct"
    echo "2. Database user exists"
    echo "3. Database server is running"
    echo ""
    echo "To fix password:"
    echo "  sudo -u postgres psql"
    echo "  ALTER USER postgres WITH PASSWORD 'new_password';"
    echo "  \\q"
    echo ""
    echo "Then update .env:"
    echo "  DATABASE_URL=\"postgresql://postgres:new_password@localhost:5432/jblog\""
    exit 1
  fi
else
  echo "⚠️  psql not found, skipping connection test"
fi

# 3. Stop PM2
echo -e "\n3. Stopping PM2 processes..."
pm2 delete jblog-backend 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2

# 4. Start PM2 dengan cluster mode
echo -e "\n4. Starting PM2 in cluster mode..."
cd /var/www/jblog/backend || cd backend
pm2 start ecosystem.config.cjs --env production

# 5. Wait for startup
echo -e "\n5. Waiting for startup..."
sleep 5

# 6. Check status
echo -e "\n6. Checking PM2 status..."
pm2 status

# 7. Check if cluster mode
echo -e "\n7. Verifying cluster mode..."
INSTANCE_COUNT=$(pm2 jlist 2>/dev/null | jq -r '[.[] | select(.name=="jblog-backend")] | length' 2>/dev/null || echo "0")
CPU_COUNT=$(nproc 2>/dev/null || echo "1")
MODE=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="jblog-backend") | .pm2_env.exec_mode' 2>/dev/null | head -1 || echo "unknown")

echo "Instances: $INSTANCE_COUNT"
echo "CPU Cores: $CPU_COUNT"
echo "Mode: $MODE"

if [ "$MODE" = "cluster" ] && [ "$INSTANCE_COUNT" -gt 1 ]; then
  echo "✅ Cluster mode is working!"
elif [ "$MODE" = "cluster" ] && [ "$INSTANCE_COUNT" -eq 1 ]; then
  echo "⚠️  Cluster mode enabled but only 1 instance (might be single core CPU)"
else
  echo "❌ Cluster mode not working - still in fork mode"
  echo "Check ecosystem.config.cjs:"
  echo "  - instances: 'max'"
  echo "  - exec_mode: 'cluster'"
fi

# 8. Check logs
echo -e "\n8. Recent logs (last 10 lines):"
pm2 logs jblog-backend --lines 10 --nostream 2>/dev/null | tail -10 || echo "Could not fetch logs"

# 9. Test API
echo -e "\n9. Testing API endpoint..."
sleep 2
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
  echo "✅ API is responding"
  curl -s http://localhost:8000/api/cluster-info | jq . 2>/dev/null || curl -s http://localhost:8000/api/cluster-info
else
  echo "❌ API is not responding"
  echo "Check logs: pm2 logs jblog-backend"
fi

echo -e "\n=== Done ==="
echo "Monitor logs: pm2 logs jblog-backend"
echo "Check status: pm2 status"

