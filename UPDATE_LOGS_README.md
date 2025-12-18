# Update Logs System

Sistem untuk otomatis sync update logs dari GitHub commits ke database.

## Fitur

1. **Auto-sync dari GitHub**: Parse commit messages dan buat update logs otomatis
2. **Conventional Commits Support**: Support format `feat:`, `fix:`, `docs:`, dll
3. **Version Detection**: Auto-detect version dari commit message (v1.0.0, version 1.0.0)
4. **Changes Parsing**: Auto-extract changes list dari commit message
5. **Webhook Support**: Auto-sync saat push ke GitHub (optional)

## Cara Menggunakan

### 1. Manual Sync dari Admin Panel

1. Buka `/admin/updatelogs`
2. Klik tombol "Sync dari GitHub"
3. Sistem akan fetch commits terbaru dan parse otomatis

### 2. Format Commit Message yang Didukung

#### Conventional Commits
```
feat: add new feature
fix: fix bug in login
docs: update documentation
```

#### Dengan Version
```
feat: add new feature v1.0.0
version 1.0.0: major update
```

#### Dengan Description
```
feat: add new feature

This feature adds support for...
```

#### Dengan Changes List
```
feat: add new feature

- Add user authentication
- Add profile page
- Fix login bug
```

### 3. Setup GitHub Webhook (Optional)

Untuk auto-sync setiap push:

1. Buka GitHub repo > Settings > Webhooks > Add webhook
2. Payload URL: `https://yourdomain.com/api/updatelog/webhook`
3. Content type: `application/json`
4. Events: Pilih "Just the push event"
5. Secret: (optional) Set `GITHUB_WEBHOOK_SECRET` di `.env`

## Environment Variables

```env
GITHUB_REPO=JoshuaRVLS/JBlog  # Format: owner/repo
GITHUB_TOKEN=your_github_token
GITHUB_WEBHOOK_SECRET=your_webhook_secret  # Optional
```

## API Endpoints

- `GET /api/updatelog/` - Get all update logs
- `POST /api/updatelog/sync` - Manual sync dari GitHub (admin only)
- `POST /api/updatelog/webhook` - Webhook endpoint untuk auto-sync
- `POST /api/updatelog/` - Create update log manually (admin only)
- `DELETE /api/updatelog/:id` - Delete update log (admin only)

