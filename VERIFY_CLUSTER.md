# Cara Verifikasi Cluster Mode Berjalan

Panduan untuk memastikan PM2 cluster mode bekerja dengan benar.

## 1. Cek Status PM2

```bash
pm2 status
```

**Output yang diharapkan untuk cluster mode:**
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

**Indikator cluster mode bekerja:**
- ✅ Mode menunjukkan `cluster` (bukan `fork`)
- ✅ Ada **multiple instances** dengan nama yang sama (`jblog-backend`)
- ✅ Jumlah instance = jumlah CPU core (atau sesuai `instances: "max"`)

## 2. Cek Jumlah Instance

```bash
# Cek jumlah instance yang berjalan
pm2 list | grep jblog-backend | wc -l

# Atau lebih detail
pm2 describe jblog-backend
```

**Output yang diharapkan:**
- Jika CPU punya 4 cores, harus ada 4 instances
- Jika CPU punya 8 cores, harus ada 8 instances
- Setiap instance punya `instance_id` yang berbeda (0, 1, 2, 3, ...)

## 3. Cek Process ID (PID)

```bash
# Setiap instance harus punya PID berbeda
pm2 jlist | jq '.[] | {name, pid, pm_id, instance_id}'
```

**Output yang diharapkan:**
```json
[
  {"name": "jblog-backend", "pid": 12345, "pm_id": 0, "instance_id": "0"},
  {"name": "jblog-backend", "pid": 12346, "pm_id": 1, "instance_id": "1"},
  {"name": "jblog-backend", "pid": 12347, "pm_id": 2, "instance_id": "2"},
  {"name": "jblog-backend", "pid": 12348, "pm_id": 3, "instance_id": "3"}
]
```

## 4. Cek Environment Variable INSTANCE_ID

Setiap instance harus punya `INSTANCE_ID` yang berbeda:

```bash
# Cek di log atau dari process
pm2 logs jblog-backend --lines 50 | grep INSTANCE_ID
```

Atau tambahkan di code untuk log instance ID:
```typescript
console.log(`🚀 Server started on instance ${process.env.INSTANCE_ID || '0'}`);
```

## 5. Test Load Balancing

Cluster mode akan **load balance** request ke semua instance. Test dengan:

```bash
# Buat script test
for i in {1..20}; do
  curl -s http://localhost:8000/api/health > /dev/null
  echo "Request $i"
done

# Cek log - request harus terdistribusi ke berbagai instance
pm2 logs jblog-backend --lines 100 | grep "Request\|Instance"
```

## 6. Cek Redis Connection (untuk Socket.IO)

Jika pakai Socket.IO dengan Redis adapter, cek apakah semua instance connect ke Redis:

```bash
# Cek koneksi Redis dari semua instance
redis-cli CLIENT LIST | grep -i jblog
```

Atau tambahkan log di code:
```typescript
if (ENABLE_CLUSTER) {
  console.log(`✅ Redis adapter connected for instance ${process.env.INSTANCE_ID}`);
}
```

## 7. Monitor Real-time

```bash
# Monitor CPU dan memory usage per instance
pm2 monit

# Atau
pm2 status
```

**Yang harus terlihat:**
- Multiple processes dengan nama sama
- CPU usage terdistribusi (tidak semua di satu process)
- Memory usage per instance

## 8. Test dengan Stress Test

```bash
# Install Apache Bench (jika belum ada)
sudo apt install apache2-utils

# Test dengan 100 concurrent requests
ab -n 1000 -c 10 http://localhost:8000/api/health

# Monitor di terminal lain
pm2 monit
```

**Indikator cluster bekerja:**
- Request terdistribusi ke semua instance
- CPU usage terdistribusi merata
- Response time lebih baik daripada single instance

## 9. Cek di Code (Backend)

Tambahkan endpoint untuk cek cluster info:

```typescript
// Di routes atau controller
router.get('/cluster-info', (req, res) => {
  res.json({
    clusterMode: process.env.ENABLE_CLUSTER === 'true',
    instanceId: process.env.INSTANCE_ID || '0',
    pid: process.pid,
    cpuCount: require('os').cpus().length,
    nodeVersion: process.version,
  });
});
```

Test:
```bash
curl http://localhost:8000/api/cluster-info
```

Refresh beberapa kali - `instanceId` dan `pid` harus berbeda (karena load balancing).

## 10. Verifikasi Socket.IO dengan Redis

Jika pakai Socket.IO, test apakah messages terdistribusi:

```bash
# Di browser console atau test script
# Connect multiple clients ke Socket.IO
# Send message dari satu client
# Semua client harus terima message (karena Redis adapter)

# Cek di log
pm2 logs jblog-backend | grep "socket\|redis"
```

## Troubleshooting

### Jika hanya 1 instance muncul:

1. **Cek ecosystem.config.cjs:**
   ```javascript
   instances: "max",  // Harus "max" atau angka > 1
   exec_mode: "cluster",  // Harus "cluster"
   ```

2. **Cek apakah cluster mode enabled:**
   ```bash
   pm2 describe jblog-backend | grep -i "exec_mode\|instances"
   ```

3. **Restart dengan force:**
   ```bash
   pm2 delete jblog-backend
   pm2 start ecosystem.config.cjs --env production
   ```

### Jika error "spawn tsx ENOENT":

1. **Cek tsx terinstall:**
   ```bash
   cd backend
   npm list tsx
   ```

2. **Install tsx jika belum:**
   ```bash
   npm install tsx
   ```

3. **Atau gunakan node dengan compiled JS:**
   ```javascript
   // Di ecosystem.config.cjs
   script: "./dist/index.js",
   interpreter: "node",
   // Hapus interpreter_args
   ```

## Quick Check Script

Buat file `check-cluster.sh`:

```bash
#!/bin/bash

echo "=== PM2 Cluster Status ==="
pm2 status

echo -e "\n=== Instance Count ==="
INSTANCE_COUNT=$(pm2 jlist | jq '[.[] | select(.name=="jblog-backend")] | length')
CPU_COUNT=$(nproc)
echo "Instances: $INSTANCE_COUNT"
echo "CPU Cores: $CPU_COUNT"

if [ "$INSTANCE_COUNT" -eq "$CPU_COUNT" ]; then
  echo "✅ Cluster mode working correctly!"
else
  echo "⚠️  Expected $CPU_COUNT instances, found $INSTANCE_COUNT"
fi

echo -e "\n=== Instance IDs ==="
pm2 jlist | jq -r '.[] | select(.name=="jblog-backend") | "Instance \(.pm_id): PID \(.pid), ID \(.instance_id // "N/A")"'

echo -e "\n=== Redis Connection (if enabled) ==="
redis-cli ping 2>/dev/null && echo "✅ Redis connected" || echo "❌ Redis not connected"
```

Jalankan:
```bash
chmod +x check-cluster.sh
./check-cluster.sh
```

