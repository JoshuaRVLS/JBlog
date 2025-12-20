# Cara Verifikasi Cluster Mode Berjalan

## Quick Check

### 1. Cek PM2 Status
```bash
pm2 status
```

**Yang harus terlihat:**
- ✅ Mode: `cluster` (bukan `fork`)
- ✅ Multiple instances dengan nama sama (`jblog-backend`)
- ✅ Jumlah instance = jumlah CPU core

**Contoh output yang benar:**
```
┌─────┬──────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ mode    │ ↺       │ status  │ cpu     │
├─────┼──────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ jblog-backend│ cluster │ 0       │ online  │ 0%      │
│ 1   │ jblog-backend│ cluster │ 0       │ online  │ 0%      │
│ 2   │ jblog-backend│ cluster │ 0       │ online  │ 0%      │
│ 3   │ jblog-backend│ cluster │ 0       │ online  │ 0%      │
└─────┴──────────────┴─────────┴─────────┴─────────┴──────────┘
```

### 2. Test Cluster Endpoint
```bash
# Test beberapa kali - instance ID dan PID harus berbeda
for i in {1..5}; do
  echo "Request $i:"
  curl -s http://localhost:8000/api/cluster-info | jq
  sleep 0.5
done
```

**Yang harus terlihat:**
- `instanceId` berbeda-beda (0, 1, 2, 3, ...)
- `pid` berbeda-beda (karena setiap instance punya process ID sendiri)
- `clusterMode: true`
- `cpuCount` sesuai jumlah CPU core

### 3. Cek Log untuk Instance ID
```bash
pm2 logs jblog-backend --lines 50 | grep "Instance:"
```

**Yang harus terlihat:**
```
🚀 Server berjalan di http://localhost:8000 (Instance: 0)
🚀 Server berjalan di http://localhost:8000 (Instance: 1)
🚀 Server berjalan di http://localhost:8000 (Instance: 2)
🚀 Server berjalan di http://localhost:8000 (Instance: 3)
```

### 4. Cek Redis Adapter (jika enabled)
```bash
pm2 logs jblog-backend --lines 50 | grep "Redis Adapter"
```

**Yang harus terlihat:**
```
✅ Socket.IO Redis Adapter enabled for cluster mode
```

### 5. Run Script Check
```bash
cd backend
./check-cluster.sh
```

## Troubleshooting

### Jika hanya 1 instance muncul:

1. **Cek ecosystem.config.cjs:**
   ```javascript
   instances: "max",  // Harus "max" atau angka > 1
   exec_mode: "cluster",  // Harus "cluster"
   ```

2. **Restart dengan force:**
   ```bash
   pm2 delete jblog-backend
   pm2 start ecosystem.config.cjs --env production
   ```

3. **Cek apakah cluster mode enabled di .env:**
   ```env
   ENABLE_CLUSTER=true
   ```

### Jika error "spawn tsx ENOENT":

1. **Install tsx:**
   ```bash
   cd backend
   npm install tsx
   ```

2. **Atau gunakan node dengan compiled JS:**
   ```javascript
   // Di ecosystem.config.cjs
   script: "./dist/index.js",
   interpreter: "node",
   // Hapus interpreter_args
   ```

### Jika error database connection:

Error seperti `PrismaPgAdapter.onError` biasanya karena:
1. **Connection pool habis** - terlalu banyak instance connect ke database
2. **Database connection timeout**
3. **Database server overload**

**Solusi:**

1. **Tambah connection pool limit di Prisma:**
   ```typescript
   // Di lib/db.ts
   const db = new PrismaClient({
     adapter: new PrismaPg({
       connectionString: process.env.DATABASE_URL,
       connection_limit: 5, // Limit per instance
     }),
   });
   ```

2. **Atau kurangi jumlah instance:**
   ```javascript
   // Di ecosystem.config.cjs
   instances: 2, // Bukan "max" jika database tidak kuat
   ```

3. **Cek database connection limit:**
   ```sql
   -- Di PostgreSQL
   SHOW max_connections;
   
   -- Cek current connections
   SELECT count(*) FROM pg_stat_activity;
   ```

4. **Tambah max_connections di PostgreSQL:**
   ```bash
   # Edit postgresql.conf
   max_connections = 200  # Default biasanya 100
   
   # Restart PostgreSQL
   sudo systemctl restart postgresql
   ```

## Performance Test

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test dengan 1000 requests, 10 concurrent
ab -n 1000 -c 10 http://localhost:8000/api/health

# Monitor di terminal lain
pm2 monit
```

**Indikator cluster bekerja:**
- Request terdistribusi ke semua instance
- CPU usage terdistribusi merata
- Response time lebih baik daripada single instance

## Expected Behavior

### Single Instance (Fork Mode):
- 1 process
- Semua request ke 1 process
- CPU usage tinggi di 1 process

### Cluster Mode:
- Multiple processes (sesuai CPU core)
- Request terdistribusi (load balancing)
- CPU usage terdistribusi merata
- Socket.IO messages terdistribusi via Redis

## Verification Checklist

- [ ] `pm2 status` menunjukkan multiple instances dengan mode `cluster`
- [ ] `/api/cluster-info` mengembalikan `instanceId` berbeda saat di-refresh
- [ ] Log menunjukkan "Instance: 0", "Instance: 1", dll
- [ ] Redis adapter enabled (jika `ENABLE_CLUSTER=true`)
- [ ] Tidak ada error database connection
- [ ] Load test menunjukkan distribusi request ke semua instance

