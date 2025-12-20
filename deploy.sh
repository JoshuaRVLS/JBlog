#!/bin/bash

# JBlog Backend Deployment Script
# Usage: ./deploy.sh [user@host] [remote-path]

VPS_USER="${1:-user}"
VPS_HOST="${2:-208.76.40.201}"
VPS_PATH="${3:-/var/www/jblog-backend}"

echo "🚀 Deploying JBlog Backend to ${VPS_USER}@${VPS_HOST}:${VPS_PATH}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if rsync is available
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}❌ rsync not found. Please install rsync.${NC}"
    exit 1
fi

# Sync files to VPS
echo -e "${YELLOW}📦 Syncing files to VPS...${NC}"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'logs' \
  --exclude 'uploads' \
  --exclude '.env' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  ./ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to sync files${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Files synced!${NC}"

# Run commands on VPS
echo -e "${YELLOW}🔧 Running setup commands on VPS...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
set -e

cd ${VPS_PATH}

echo "📦 Installing dependencies..."
pnpm install --production

echo "🔨 Generating Prisma client..."
pnpm db:generate

echo "🔄 Reloading PM2..."
pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs --env production

echo "💾 Saving PM2 process list..."
pm2 save

echo "✅ Deployment complete!"
pm2 status

ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

