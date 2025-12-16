# Fix Database Error - Column Does Not Exist

## Masalah
Error `Column does not exist` terjadi karena:
- Prisma schema sudah di-update dengan model `PasswordResetToken`
- Prisma client sudah di-generate dengan schema baru
- **Tapi database belum di-sync** - table `PasswordResetToken` belum dibuat di database

## Solusi Cepat

### Step 1: Pastikan Database Connection
Cek file `.env` di folder `backend`, pastikan `DATABASE_URL` benar:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Step 2: Sync Database Schema

**Opsi A: Menggunakan DB Push (Paling Cepat untuk Development)**
```bash
cd backend
npx prisma db push
```

**Opsi B: Menggunakan Migrate (Lebih Aman untuk Production)**
```bash
cd backend
npx prisma migrate dev --name add_password_reset_token
```

### Step 3: Generate Prisma Client (Jika belum)
```bash
cd backend
npx prisma generate
```

### Step 4: Restart Backend Server
```bash
npm run dev
```

## Verifikasi

Setelah migration, cek apakah table sudah dibuat:
```bash
npx prisma studio
```

Atau langsung test endpoint:
```bash
curl -X POST http://localhost:8000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Jika Masih Error

1. **Cek connection string** - pastikan database bisa diakses
2. **Cek Prisma client** - pastikan sudah di-generate:
   ```bash
   ls -la backend/generated/prisma/
   ```
3. **Cek migration status**:
   ```bash
   npx prisma migrate status
   ```

## Catatan Penting

- `prisma db push` langsung sync schema ke database tanpa membuat migration file
- `prisma migrate dev` membuat migration file dan sync ke database
- Setelah schema berubah, **selalu** jalankan `prisma generate` untuk update Prisma client

