# Fix Database Authentication Error

Error: `Authentication failed against the database server, the provided database credentials for postgres are not valid`

## Quick Fix

### 1. Cek DATABASE_URL di .env

```bash
cd /var/www/jblog/backend
cat .env | grep DATABASE_URL
```

**Format yang benar:**
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

### 2. Test Koneksi Database

```bash
# Test dengan psql
psql $DATABASE_URL -c "SELECT version();"
```

Jika error, berarti kredensial salah atau database tidak bisa diakses.

### 3. Reset Password PostgreSQL (jika perlu)

```bash
# Login sebagai postgres user
sudo -u postgres psql

# Di dalam psql:
ALTER USER postgres WITH PASSWORD 'new_password_here';
\q
```

### 4. Update .env dengan Password Baru

```bash
# Edit .env
nano /var/www/jblog/backend/.env

# Update DATABASE_URL:
DATABASE_URL="postgresql://postgres:new_password_here@localhost:5432/jblog"
```

### 5. Test Koneksi Lagi

```bash
# Test dengan psql
psql "postgresql://postgres:new_password_here@localhost:5432/jblog" -c "SELECT 1;"
```

### 6. Restart PM2

```bash
pm2 restart jblog-backend
pm2 logs jblog-backend --lines 50
```

## Troubleshooting Detail

### Jika Database di Server Lain

1. **Cek apakah database server bisa diakses:**
   ```bash
   # Test ping
   ping database-host
   
   # Test port
   telnet database-host 5432
   ```

2. **Cek firewall:**
   ```bash
   # Di database server
   sudo ufw status
   sudo ufw allow from your-app-server-ip to any port 5432
   ```

3. **Cek pg_hba.conf:**
   ```bash
   # Di database server
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   
   # Pastikan ada baris untuk allow connection:
   host    all             all             your-app-server-ip/32    md5
   ```

### Jika Menggunakan Managed Database (Supabase, AWS RDS, dll)

1. **Cek connection string di dashboard**
2. **Pastikan password tidak ada special characters yang perlu di-encode**
3. **Jika ada special characters, URL encode:**
   ```bash
   # Contoh: password dengan @ menjadi %40
   DATABASE_URL="postgresql://user:pass%40word@host:5432/db"
   ```

### Jika Password Berubah

1. **Update password di database:**
   ```sql
   ALTER USER your_username WITH PASSWORD 'new_password';
   ```

2. **Update .env:**
   ```env
   DATABASE_URL="postgresql://your_username:new_password@host:5432/database"
   ```

3. **Restart aplikasi:**
   ```bash
   pm2 restart jblog-backend
   ```

## Verifikasi

Setelah fix, cek:

```bash
# 1. Test connection
psql $DATABASE_URL -c "SELECT 1;"

# 2. Cek PM2 logs
pm2 logs jblog-backend --lines 20

# 3. Test API endpoint
curl http://localhost:8000/api/health
```

## Common Issues

### Issue 1: Password dengan Special Characters
**Solusi:** URL encode password
```env
# Password: my@pass#123
DATABASE_URL="postgresql://user:my%40pass%23123@host:5432/db"
```

### Issue 2: Database User Tidak Ada
**Solusi:** Buat user baru
```sql
CREATE USER jblog_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE jblog TO jblog_user;
```

### Issue 3: Database Tidak Ada
**Solusi:** Buat database
```sql
CREATE DATABASE jblog;
GRANT ALL PRIVILEGES ON DATABASE jblog TO jblog_user;
```

### Issue 4: Connection Pool Exhausted
**Solusi:** Restart PostgreSQL atau kurangi instances
```bash
sudo systemctl restart postgresql
```

## Quick Script untuk Test

```bash
#!/bin/bash
echo "Testing database connection..."

# Load .env
export $(cat /var/www/jblog/backend/.env | grep DATABASE_URL | xargs)

# Test connection
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✅ Database connection OK"
else
  echo "❌ Database connection FAILED"
  echo "Check your DATABASE_URL in .env"
fi
```

