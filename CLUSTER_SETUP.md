# Cluster Mode Setup untuk JBlog Backend

Dokumen ini menjelaskan cara mengaktifkan cluster mode untuk backend agar bisa menggunakan semua CPU core dan mendapatkan performa maksimal, terutama untuk Socket.IO.

## Prerequisites

1. **PM2** - Process manager untuk cluster mode
2. **Redis** - Untuk Socket.IO adapter (agar state terbagi antar worker)

## Instalasi

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Install Redis

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### macOS:
```bash
brew install redis
brew services start redis
```

#### Docker (Recommended):
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 3. Konfigurasi Environment Variables

Tambahkan ke `.env`:

```env
# Cluster Mode
ENABLE_CLUSTER=true

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, kosongkan jika tidak ada password
REDIS_DB=0

# Port (default: 8000)
PORT=8000
```

## Cara Menggunakan

### Development Mode (Single Instance)

```bash
pnpm dev
```

### Production Mode dengan Cluster

```bash
# Start dengan cluster mode (menggunakan semua CPU core)
pnpm start

# Atau untuk development dengan cluster
pnpm start:dev
```

### PM2 Commands

```bash
# Lihat status
pm2 status

# Lihat logs
pnpm logs

# Monitor real-time
pnpm monit

# Restart
pnpm restart

# Reload (zero-downtime)
pnpm reload

# Stop
pnpm stop

# Hapus dari PM2
pnpm delete
```

## Performance Benefits

1. **Multi-Core Utilization**: Menggunakan semua CPU core yang tersedia
2. **Load Balancing**: Request didistribusikan ke semua worker
3. **High Availability**: Jika satu worker crash, worker lain tetap berjalan
4. **Socket.IO Scaling**: Dengan Redis adapter, Socket.IO bisa share state antar worker

## Monitoring

### PM2 Monitoring

```bash
pnpm monit
```

### PM2 Web Dashboard

```bash
pm2 web
# Akses di http://localhost:9615
```

### Check Worker Processes

```bash
pm2 list
```

## Troubleshooting

### Redis Connection Error

Jika Redis tidak bisa connect:
1. Pastikan Redis sudah running: `redis-cli ping` (harus return `PONG`)
2. Check Redis host/port di `.env`
3. Jika tidak ingin pakai Redis, set `ENABLE_CLUSTER=false` di `.env`

### Socket.IO Not Working Across Workers

Pastikan:
1. Redis sudah running dan bisa diakses
2. `ENABLE_CLUSTER=true` di `.env`
3. Redis adapter sudah terpasang (cek log saat startup)

### Port Already in Use

Jika port 8000 sudah digunakan:
1. Change `PORT` di `.env`
2. Atau stop process yang menggunakan port tersebut

## Production Deployment

### Dengan PM2 Ecosystem

File `ecosystem.config.cjs` sudah dikonfigurasi untuk:
- Auto-restart on crash
- Memory limit (1GB per worker)
- Logging ke file
- Graceful shutdown

### Environment Variables untuk Production

```env
NODE_ENV=production
ENABLE_CLUSTER=true
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
PORT=8000
FRONTEND_URL=https://your-frontend-url.com
```

### Systemd Service (Optional)

Buat file `/etc/systemd/system/jblog-backend.service`:

```ini
[Unit]
Description=JBlog Backend PM2
After=network.target

[Service]
Type=forking
User=your-user
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/pm2 start ecosystem.config.cjs
ExecReload=/usr/bin/pm2 reload ecosystem.config.cjs
ExecStop=/usr/bin/pm2 stop ecosystem.config.cjs
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable jblog-backend
sudo systemctl start jblog-backend
```

## Notes

- **Development**: Biasanya tidak perlu cluster mode, cukup `pnpm dev`
- **Production**: Sangat disarankan untuk menggunakan cluster mode
- **Redis**: Wajib jika ingin Socket.IO bekerja dengan baik di cluster mode
- **Memory**: Setiap worker menggunakan memory, monitor dengan `pm2 monit`

