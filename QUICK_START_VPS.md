# Quick Start: Deploy ke VPS 208.76.40.201

## TL;DR - Langkah Cepat

### 1. Di VPS (SSH ke 208.76.40.201)

```bash
# Install dependencies
sudo apt update
sudo apt install -y nodejs npm redis-server nginx
npm install -g pnpm pm2

# Setup directory
sudo mkdir -p /var/www/jblog-backend
sudo chown $USER:$USER /var/www/jblog-backend
cd /var/www/jblog-backend
```

### 2. Deploy Code (Pilih salah satu)

**Opsi A: Pakai deploy script (dari local)**
```bash
cd /path/to/jblog/backend
./deploy.sh user@208.76.40.201 /var/www/jblog-backend
```

**Opsi B: Manual (dari local)**
```bash
# Copy files
scp -r * user@208.76.40.201:/var/www/jblog-backend/

# SSH ke VPS
ssh user@208.76.40.201
cd /var/www/jblog-backend
pnpm install
```

**Opsi C: Git (di VPS)**
```bash
# Di VPS
cd /var/www
git clone https://github.com/your-repo/jblog.git
cd jblog/backend
pnpm install
```

### 3. Setup .env di VPS

```bash
# Di VPS
cd /var/www/jblog-backend
nano .env
```

Paste konfigurasi (lihat DEPLOY_VPS.md untuk detail)

### 4. Start dengan PM2

```bash
# Di VPS
cd /var/www/jblog-backend
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup  # Follow instructions
```

### 5. Setup Nginx (Optional)

```bash
sudo nano /etc/nginx/sites-available/jblog-backend
```

Paste config (lihat DEPLOY_VPS.md)

```bash
sudo ln -s /etc/nginx/sites-available/jblog-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## File Ecosystem

**File `ecosystem.config.cjs` HARUS ada di VPS**, di folder `/var/www/jblog-backend/`

Jika belum ada, copy dari local:
```bash
scp ecosystem.config.cjs user@208.76.40.201:/var/www/jblog-backend/
```

## Update Code

Setelah update code, reload PM2:
```bash
# Di VPS
cd /var/www/jblog-backend
git pull  # jika pakai git
pnpm install  # jika ada dependency baru
pm2 reload jblog-backend
```

Atau pakai deploy script dari local:
```bash
./deploy.sh user@208.76.40.201 /var/www/jblog-backend
```

## Check Status

```bash
pm2 status
pm2 logs jblog-backend
pm2 monit
```

## Important Notes

1. ✅ **File ecosystem.config.cjs di VPS** (bukan di local)
2. ✅ **Redis harus running** di VPS (`redis-cli ping`)
3. ✅ **.env harus ada** di VPS dengan `ENABLE_CLUSTER=true`
4. ✅ **PM2 auto-start** dengan `pm2 startup && pm2 save`

