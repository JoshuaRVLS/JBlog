# Migration Guide - Fix Password Reset Error

## Error yang Terjadi
Error `Column does not exist` terjadi karena database schema belum di-sync dengan Prisma schema setelah menambahkan model `PasswordResetToken`.

## Solusi

### Opsi 1: Menggunakan Prisma DB Push (Recommended untuk Development)
```bash
cd backend
npx prisma db push
npx prisma generate
```

### Opsi 2: Menggunakan Prisma Migrate (Recommended untuk Production)
```bash
cd backend
# Jika ada drift, resolve dulu dengan:
npx prisma migrate resolve --applied <migration_name>

# Atau buat migration baru:
npx prisma migrate dev --name add_password_reset_token
npx prisma generate
```

### Opsi 3: Reset Database (HATI-HATI: Menghapus semua data!)
```bash
cd backend
npx prisma migrate reset
npx prisma generate
```

## Setelah Migration

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Restart Backend Server:**
   ```bash
   npm run dev
   ```

## Verifikasi

Setelah migration berhasil, pastikan:
- Table `PasswordResetToken` sudah ada di database
- Prisma client sudah di-generate ulang
- Backend server bisa start tanpa error

## Troubleshooting

Jika masih ada error:
1. Pastikan `DATABASE_URL` di `.env` benar
2. Pastikan database connection aktif
3. Cek apakah ada migration yang pending:
   ```bash
   npx prisma migrate status
   ```
4. Jika ada drift, resolve dengan:
   ```bash
   npx prisma migrate resolve --applied <migration_name>
   ```

