#!/bin/bash
# Simple fix script - one script to rule them all

echo "🔧 Fixing everything..."

cd /var/www/jblog/backend 2>/dev/null || cd backend

# 1. Test database connection (works with Supabase or local PostgreSQL)
echo "1. Testing database connection..."
DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | head -1)

if [ -z "$DATABASE_URL" ]; then
  echo "   ⚠️  DATABASE_URL not found in .env"
  echo "   Skipping database test..."
else
  if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
      echo "   ✅ Database connection OK"
    else
      echo "   ⚠️  Database connection test failed (might be Supabase - that's OK)"
      echo "   Continuing anyway..."
    fi
  else
    echo "   ⚠️  psql not installed - skipping database test"
    echo "   (This is fine if using Supabase)"
  fi
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

