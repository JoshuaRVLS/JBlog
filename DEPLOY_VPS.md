# Deploy JBlog Backend ke VPS dengan PM2 Cluster Mode

Panduan lengkap untuk deploy backend ke VPS dan menjalankannya dengan PM2 cluster mode.

## Prerequisites

1. **VPS dengan SSH access** (IP: 208.76.40.201)
2. **Node.js & pnpm** terinstall di VPS
3. **Redis** terinstall di VPS
4. **Git** terinstall di VPS (optional, untuk pull dari repo)

## Step 1: Setup Awal di VPS

### 1.1 SSH ke VPS

```bash
ssh user@208.76.40.201
# atau
ssh root@208.76.40.201
```

### 1.2 Install Dependencies di VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (jika belum ada)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 global
npm install -g pm2

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Verify installations
node --version
pnpm --version
pm2 --version
redis-cli ping  # Should return PONG
```

## Step 2: Deploy Code ke VPS

Ada beberapa cara untuk deploy code ke VPS:

### Opsi A: Menggunakan Git (Recommended)

```bash
# Di VPS, clone atau pull repository
cd /var/www  # atau directory yang diinginkan
git clone https://github.com/your-username/jblog.git
cd jblog/backend

# Install dependencies
pnpm install

# Copy .env file (buat manual atau dari local)
nano .env
# Isi dengan environment variables yang diperlukan
```

### Opsi B: Menggunakan SCP (dari local machine)

```bash
# Dari local machine, copy folder backend ke VPS
scp -r backend/ user@208.76.40.201:/var/www/jblog-backend/

# SSH ke VPS
ssh user@208.76.40.201
cd /var/www/jblog-backend
pnpm install
```

### Opsi C: Menggunakan rsync (dari local machine)

```bash
# Sync folder backend ke VPS (exclude node_modules)
rsync -avz --exclude 'node_modules' --exclude '.git' \
  backend/ user@208.76.40.201:/var/www/jblog-backend/

# SSH ke VPS
ssh user@208.76.40.201
cd /var/www/jblog-backend
pnpm install
```

## Step 3: Setup Environment Variables

```bash
# Di VPS, buat/edit .env file
cd /var/www/jblog-backend
nano .env
```

Isi dengan:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jblog?schema=public"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
COOKIE_SECRET="your-cookie-secret"

# Server
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-frontend-domain.com

# Cluster Mode
ENABLE_CLUSTER=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Supabase (jika pakai)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# Email (jika pakai)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Step 4: Setup Database

```bash
# Di VPS, generate Prisma client
cd /var/www/jblog-backend
pnpm db:generate

# Run migrations
pnpm db:migrate

# Atau push schema (development)
pnpm db:push
```

## Step 5: Setup PM2 Ecosystem

File `ecosystem.config.cjs` **HARUS ada di VPS** (di folder backend).

Pastikan file sudah ada:
```bash
cd /var/www/jblog-backend
ls -la ecosystem.config.cjs
```

Jika belum ada, copy dari local:
```bash
# Dari local machine
scp backend/ecosystem.config.cjs user@208.76.40.201:/var/www/jblog-backend/
```

## Step 6: Start dengan PM2

```bash
# Di VPS
cd /var/www/jblog-backend

# Start dengan PM2 cluster mode
pm2 start ecosystem.config.cjs --env production

# Atau menggunakan npm script (jika sudah setup)
pnpm start

# Check status
pm2 status

# View logs
pm2 logs jblog-backend

# Monitor
pm2 monit
```

## Step 7: Setup PM2 untuk Auto-Start

```bash
# Generate startup script
pm2 startup

# Save current PM2 process list
pm2 save
```

Ini akan membuat PM2 auto-start saat VPS reboot.

## Step 8: Setup Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/jblog-backend
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # atau 208.76.40.201

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Socket.IO support
        proxy_set_header Connection "upgrade";
    }
}
```

Enable dan restart:
```bash
sudo ln -s /etc/nginx/sites-available/jblog-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: Setup Firewall

```bash
# Allow port 8000 (internal)
sudo ufw allow 8000/tcp

# Allow port 80 (HTTP)
sudo ufw allow 80/tcp

# Allow port 443 (HTTPS)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## Step 10: Setup SSL (Optional, Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Useful PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs jblog-backend

# View specific log
pm2 logs jblog-backend --lines 100

# Restart
pm2 restart jblog-backend

# Reload (zero-downtime)
pm2 reload jblog-backend

# Stop
pm2 stop jblog-backend

# Delete
pm2 delete jblog-backend

# Monitor
pm2 monit

# View info
pm2 info jblog-backend

# Save current process list
pm2 save

# Clear logs
pm2 flush
```

## Monitoring & Maintenance

### Check Status
```bash
pm2 status
pm2 monit
```

### View Logs
```bash
pm2 logs jblog-backend --lines 50
tail -f /var/www/jblog-backend/logs/pm2-combined.log
```

### Restart After Code Update
```bash
cd /var/www/jblog-backend
git pull  # jika pakai git
pnpm install  # jika ada dependency baru
pm2 reload jblog-backend  # zero-downtime reload
```

## Troubleshooting

### PM2 tidak start
```bash
# Check logs
pm2 logs jblog-backend --err

# Check if port already in use
sudo lsof -i :8000

# Check Redis
redis-cli ping
```

### Socket.IO tidak bekerja
```bash
# Check Redis connection
redis-cli ping

# Check ENABLE_CLUSTER in .env
cat .env | grep ENABLE_CLUSTER

# Check PM2 logs for Redis errors
pm2 logs jblog-backend | grep -i redis
```

### Port sudah digunakan
```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>

# Or change PORT in .env
```

## Quick Deployment Script

Buat file `deploy.sh` di local:

```bash
#!/bin/bash
# deploy.sh

VPS_USER="user"
VPS_HOST="208.76.40.201"
VPS_PATH="/var/www/jblog-backend"

echo "🚀 Deploying to VPS..."

# Sync files (exclude node_modules, .git, etc)
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'logs' \
  --exclude 'uploads' \
  --exclude '.env' \
  backend/ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

echo "✅ Files synced!"

# SSH and run commands
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /var/www/jblog-backend
pnpm install
pnpm db:generate
pm2 reload jblog-backend
ENDSSH

echo "✅ Deployment complete!"
```

Make executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Summary

1. **File ecosystem.config.cjs HARUS di VPS** (di folder backend)
2. **Deploy code ke VPS** (git, scp, atau rsync)
3. **Setup .env di VPS** dengan konfigurasi production
4. **Install dependencies** di VPS (`pnpm install`)
5. **Start dengan PM2** (`pm2 start ecosystem.config.cjs`)
6. **Setup auto-start** (`pm2 startup && pm2 save`)
7. **Setup reverse proxy** (Nginx) untuk akses dari luar
8. **Setup firewall** untuk security

File ecosystem tinggal di VPS, tidak perlu di local (kecuali untuk development).

