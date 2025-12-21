# OAuth Setup Guide

## Environment Variables

Tambahkan environment variables berikut ke file `.env` di backend:

### Google OAuth
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### GitHub OAuth
```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Base URL
```
NEXT_PUBLIC_SITE_URL=https://jblog.space
```

## Setup Instructions

### Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. If prompted, configure the OAuth consent screen first:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in app name, user support email, and developer contact
   - Add scopes: `openid`, `email`, `profile`
   - Add test users if app is in testing mode
6. Back to Credentials, choose "Web application"
7. Add **both** authorized redirect URIs (you can add multiple):
   - **Development**: `http://localhost:3000/api/auth/google/callback`
   - **Production**: `https://jblog.space/api/auth/google/callback`
   
   Click "Add URI" for each one. Both URIs should be listed in the authorized redirect URIs section.
8. Copy Client ID and Client Secret to `.env`

**Note:** No need to enable Google+ API (it's deprecated). We use standard OAuth 2.0 endpoints (`oauth2.googleapis.com`).

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: `JBlog`
   - Homepage URL: `https://jblog.space`
   - Authorization callback URL: `https://jblog.space/api/auth/github/callback`
4. Click "Register application"
5. Copy Client ID and Client Secret to `.env`

## Database Migration

Setelah menambahkan environment variables, jalankan migration:

```bash
cd backend
npm run db:push
```

Ini akan menambahkan field `googleId`, `githubId`, dan `oauthProvider` ke tabel User.

## API Endpoints

- `GET /api/auth/google/url` - Get Google OAuth authorization URL
- `GET /api/auth/google/callback` - Handle Google OAuth callback
- `GET /api/auth/github/url` - Get GitHub OAuth authorization URL
- `GET /api/auth/github/callback` - Handle GitHub OAuth callback

## Features

- ✅ Automatic user creation for new OAuth users
- ✅ Link OAuth account to existing email-based account
- ✅ Pre-verified email for OAuth users (no email verification needed)
- ✅ Profile picture sync from OAuth provider
- ✅ Secure token generation and refresh token management
- ✅ Support for both Google and GitHub

