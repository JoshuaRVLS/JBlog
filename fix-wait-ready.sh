#!/bin/bash

echo "=== Fixing PM2 wait_ready issue ==="

# Option 1: Disable wait_ready temporarily to see actual errors
echo "Option 1: Disabling wait_ready to see errors..."
cd /var/www/jblog/backend || cd backend

# Backup config
cp ecosystem.config.cjs ecosystem.config.cjs.backup

# Disable wait_ready
sed -i 's/wait_ready: true/wait_ready: false/' ecosystem.config.cjs

echo "✅ wait_ready disabled. Restarting PM2..."

# Stop and restart
pm2 delete jblog-backend 2>/dev/null || true
sleep 2
pm2 start ecosystem.config.cjs --env production

echo "Waiting 5 seconds..."
sleep 5

# Check status
pm2 status
echo ""
echo "Check logs for errors:"
pm2 logs jblog-backend --lines 30 --nostream

echo ""
echo "If you see the actual error, fix it, then:"
echo "1. Restore wait_ready: sed -i 's/wait_ready: false/wait_ready: true/' ecosystem.config.cjs"
echo "2. Restart: pm2 restart jblog-backend"

