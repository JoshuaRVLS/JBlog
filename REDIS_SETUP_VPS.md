# Setup Redis di VPS

Panduan lengkap untuk menginstall dan mengkonfigurasi Redis di VPS.

## 1. Install Redis

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install redis-server -y
```

### CentOS/RHEL:
```bash
sudo yum install redis -y
# atau untuk versi baru:
sudo dnf install redis -y
```

## 2. Troubleshooting Service Name

Jika error `Refusing to operate on alias name or linked unit file: redis.service`, coba:

```bash
# Cek service yang tersedia
systemctl list-units --type=service | grep redis
systemctl list-unit-files | grep redis

# Cek file service yang ada
ls -la /etc/systemd/system/ | grep redis
ls -la /lib/systemd/system/ | grep redis
```

### Solusi 1: Gunakan nama service yang benar
```bash
# Biasanya di Ubuntu/Debian:
sudo systemctl enable redis-server
sudo systemctl start redis-server
sudo systemctl status redis-server

# Atau jika pakai redis (tanpa -server):
sudo systemctl enable redis
sudo systemctl start redis
```

### Solusi 2: Jika ada alias/link yang bermasalah
```bash
# Hapus alias/link yang bermasalah
sudo systemctl daemon-reload
sudo systemctl reset-failed

# Coba lagi
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Solusi 3: Manual start jika systemd bermasalah
```bash
# Start Redis secara manual
sudo redis-server /etc/redis/redis.conf --daemonize yes

# Atau
sudo /etc/init.d/redis-server start
```

## 3. Verifikasi Redis Berjalan

```bash
# Cek status
sudo systemctl status redis-server

# Test koneksi
redis-cli ping
# Harus return: PONG

# Cek info
redis-cli info
```

## 4. Konfigurasi Password (Opsional tapi Recommended untuk Production)

### Edit konfigurasi Redis:
```bash
sudo nano /etc/redis/redis.conf
```

### Cari dan uncomment/edit baris berikut:
```conf
# requirepass your_strong_password_here
requirepass your_strong_password_here
```

### Atau set password via command line:
```bash
# Set password sementara (akan hilang setelah restart)
redis-cli CONFIG SET requirepass "your_strong_password_here"

# Set password permanen (edit config file)
sudo sed -i 's/# requirepass foobared/requirepass your_strong_password_here/' /etc/redis/redis.conf
```

### Restart Redis setelah set password:
```bash
sudo systemctl restart redis-server
```

### Test dengan password:
```bash
redis-cli -a your_strong_password_here ping
```

## 5. Konfigurasi untuk JBlog Backend

Tambahkan ke `.env` di backend:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_strong_password_here  # Kosongkan jika tidak pakai password
REDIS_DB=0

# Enable Cluster Mode
ENABLE_CLUSTER=true
```

## 6. Firewall (jika perlu akses dari luar)

**PENTING**: Hanya buka port Redis ke public jika benar-benar perlu dan sudah set password yang kuat!

```bash
# UFW (Ubuntu)
sudo ufw allow 6379/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=6379/tcp
sudo firewall-cmd --reload
```

**Rekomendasi**: Jangan buka port Redis ke public. Gunakan SSH tunnel atau VPN jika perlu akses remote.

## 7. Troubleshooting Umum

### Redis tidak bisa start:
```bash
# Cek log
sudo journalctl -u redis-server -n 50
sudo tail -f /var/log/redis/redis-server.log

# Cek permission
sudo chown redis:redis /var/lib/redis
sudo chmod 750 /var/lib/redis
```

### Connection refused:
```bash
# Cek apakah Redis listen di interface yang benar
sudo netstat -tlnp | grep 6379
# atau
sudo ss -tlnp | grep 6379

# Edit /etc/redis/redis.conf
# bind 127.0.0.1  # Hanya localhost (aman)
# atau
# bind 0.0.0.0    # Semua interface (perlu password!)
```

### Memory issues:
```bash
# Cek memory usage
redis-cli info memory

# Set max memory di config
# maxmemory 256mb
# maxmemory-policy allkeys-lru
```

## 8. Security Best Practices

1. **Set password yang kuat** - Minimal 32 karakter random
2. **Bind ke localhost saja** - Jangan bind ke 0.0.0.0 kecuali benar-benar perlu
3. **Disable command yang berbahaya** - Edit `/etc/redis/redis.conf`:
   ```conf
   rename-command FLUSHDB ""
   rename-command FLUSHALL ""
   rename-command CONFIG ""
   ```
4. **Gunakan firewall** - Jangan buka port 6379 ke public
5. **Update Redis secara berkala** - `sudo apt update && sudo apt upgrade redis-server`

## 9. Generate Strong Password

```bash
# Generate random password
openssl rand -base64 32

# Atau
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 10. Test Koneksi dari Backend

Setelah setup, test dari backend:

```bash
cd backend
node -e "
const Redis = require('ioredis');
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: 0
});
redis.ping().then(r => {
  console.log('Redis connected:', r);
  process.exit(0);
}).catch(e => {
  console.error('Redis error:', e);
  process.exit(1);
});
"
```

