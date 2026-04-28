# Vercel Deployment Guide

## Overview

This app is configured for deployment to Vercel using TanStack Start with Nitro as the server engine.

## Required Environment Variables

Configure these in the Vercel Dashboard under Settings > Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL pooled connection string | `postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb` |
| `ELECTRIC_URL` | Electric Cloud API URL | `https://api.electric-sql.cloud` |
| `ELECTRIC_SOURCE_ID` | Your Electric source ID | `abc123` |
| `ELECTRIC_SECRET` | Your Electric secret key | `secret_xyz` |
| `RESEND_API_KEY` | Resend API key for email | `re_xxx` |
| `APP_URL` | Production URL (for magic links) | `https://your-app.vercel.app` |
| `VITE_GOLF_COURSE_API_KEY` | Golf course API key (optional) | `key_xxx` |

## Deployment Steps

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the TanStack Start framework

### 2. Configure Environment Variables

Add all required environment variables in the Vercel Dashboard.

### 3. Deploy

Click "Deploy" - Vercel will:
1. Run `pnpm build` (includes service worker generation)
2. Deploy to their edge network
3. Auto-detect Nitro preset for Vercel

### 4. Custom Domain (Optional)

1. Go to Settings > Domains
2. Add your custom domain
3. Update `APP_URL` environment variable to match

## PWA Support

The app includes PWA support for "Add to Home Screen" on mobile:

- **Manifest**: `/manifest.json` with golf-themed branding
- **Icons**: SVG icons at 192x192 and 512x512
- **Service Worker**: Caching for offline support
- **Update Prompt**: Users see notification when new version available

## Architecture

```
                      ┌─────────────────┐
                      │  Vercel Edge    │
                      │  (Nitro preset) │
                      └────────┬────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
    ┌─────────────────┐  ┌──────────┐  ┌──────────────┐
    │ /api/electric/* │  │  SSR     │  │   Static     │
    │ (Electric Proxy)│  │  Routes  │  │   Assets     │
    └────────┬────────┘  └────┬─────┘  └──────────────┘
             │                │
             ▼                ▼
    ┌─────────────────┐  ┌──────────────────┐
    │ Electric Cloud  │  │ Neon PostgreSQL  │
    │ (real-time sync)│  │ (via pooler)     │
    └─────────────────┘  └──────────────────┘
```

## Files Changed for Deployment

- `vite.config.ts` - Added `nitro()` plugin with scanDirs
- `vercel.json` - Build configuration
- `server/routes/api/electric/[table].ts` - Production Electric proxy
- `public/manifest.json` - PWA manifest
- `public/icon-*.svg` - App icons
- `src/routes/__root.tsx` - PWA meta tags
- `src/components/ServiceWorkerRegistration.tsx` - Update prompt
- `scripts/generate-sw.ts` - Workbox service worker generator
- `package.json` - Added nitro, h3, workbox-build, tsx dependencies
