#!/bin/bash
# Simple fix script - one script to rule them all

echo "🔧 Fixing everything..."

cd /var/www/jblog/backend 2>/dev/null || cd backend

# 1. Fix database connection
echo "1. Testing database..."
if psql "$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")" -c "SELECT 1;" >/dev/null 2>&1; then
  echo "   ✅ Database OK"
else
  echo "   ❌ Database FAILED - fix password first!"
  echo "   Run: sudo -u postgres psql"
  echo "   Then: ALTER USER postgres WITH PASSWORD 'newpass';"
  exit 1
fi

# 2. Make sure start.sh is executable
chmod +x start.sh 2>/dev/null || true

# 3. Restart PM2
echo "2. Restarting PM2..."
pm2 delete jblog-backend 2>/dev/null
sleep 2
pm2 start ecosystem.config.cjs --env production
sleep 5

# 4. Check status
echo "3. Status:"
pm2 status | grep jblog-backend

echo ""
echo "✅ Done! Check: pm2 logs jblog-backend"

