# Deployment Guide

This document covers deployment strategies, environments, and CI/CD pipelines for the Golf Trip Planner app.

---

## Current State

The app is currently **client-only** with TanStack DB using local storage. Data persists in the browser but does not sync between devices.

### Future State

With Electric SQL integration, the app will sync to a PostgreSQL database, enabling:
- Multi-device access
- Real-time collaboration
- User authentication

---

## Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| **Local** | Development | `http://localhost:5173` |
| **Preview** | PR testing | `https://pr-{number}.golf-planner.preview.pages.dev` |
| **Production** | Live app | `https://golf-planner.pages.dev` |

---

## Build Process

### Local Development

```bash
# Install dependencies
pnpm install

# Start dev server (with hot reload)
pnpm dev

# Type check
pnpm exec tsc --noEmit

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Build Output

TanStack Start builds to a static site with client-side routing:

```
dist/
├── client/
│   ├── index.html
│   ├── assets/
│   │   ├── index-{hash}.js
│   │   ├── index-{hash}.css
│   │   └── vendor-{hash}.js
│   └── typography.css
└── server/              # SSR (disabled, empty)
```

---

## CI/CD Pipelines

### GitHub Actions Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PR Open   │────▶│   Quick     │────▶│   Preview   │
│             │     │   Tests     │     │   Deploy    │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Merge to   │────▶│    Full     │────▶│  Prod       │
│    main     │     │   Tests     │     │  Deploy     │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   2 AM UTC  │────▶│  Nightly    │────▶│   Issue     │
│   (cron)    │     │  Explore    │     │  Creation   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Workflow Files

| File | Trigger | Purpose |
|------|---------|---------|
| `bombadil-quick.yml` | PRs | Property tests before merge |
| `bombadil-full.yml` | Push to main | Full test suite |
| `bombadil-nightly.yml` | Cron 2 AM | Exploratory chaos testing |

---

## Deployment Targets

### Cloudflare Pages (Recommended)

Static site hosting with edge CDN and preview deployments.

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: golf-planner
          directory: dist/client
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Netlify

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist/client"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Environment Variables

### Current (Client-Only)

No environment variables required for the local-only version.

### Future (With Electric SQL)

| Variable | Description | Example |
|----------|-------------|---------|
| `ELECTRIC_URL` | Electric sync service URL | `https://electric.example.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host/db` |
| `AUTH_SECRET` | NextAuth.js secret | `random-32-char-string` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `xxx` |

---

## Health Checks

### Smoke Test

After deployment, verify:

1. **App loads**: Navigate to root URL
2. **Sample data**: Trip "Kelowna Golf Trip 2024" visible
3. **Navigation**: Can navigate between pages
4. **Scoring**: Can enter scores on scorecard

### Automated Health Check

```bash
# Simple curl check
curl -f https://golf-planner.pages.dev/ || exit 1

# With response time
curl -w "%{time_total}\n" -o /dev/null -s https://golf-planner.pages.dev/
```

---

## Rollback Procedures

### Cloudflare Pages

1. Go to Cloudflare Dashboard → Pages → golf-planner
2. Click "Deployments"
3. Find previous working deployment
4. Click "..." → "Rollback to this deployment"

### Git-Based Rollback

```bash
# Find working commit
jj log

# Revert to previous state
jj restore --from <commit-id>
jj describe -m "Rollback to <commit-id>"

# Or use git if needed
git revert HEAD
git push
```

---

## Performance Monitoring

### Core Web Vitals

Target metrics for golf-planner:

| Metric | Target | Measured |
|--------|--------|----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | TBD |
| **FID** (First Input Delay) | < 100ms | TBD |
| **CLS** (Cumulative Layout Shift) | < 0.1 | TBD |

### Bundle Analysis

```bash
# Analyze bundle size
pnpm build
npx vite-bundle-visualizer
```

---

## Security Considerations

### Current (Client-Only)

- All data stored in browser localStorage
- No authentication required
- No server-side code execution

### Future (With Auth)

- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Implement CSRF protection
- [ ] Add rate limiting
- [ ] Configure CORS properly
- [ ] Sanitize user inputs
- [ ] Audit npm dependencies

---

## Database Migrations (Future)

When Electric SQL is added:

```bash
# Create migration
pnpm drizzle-kit generate:pg

# Apply migrations
pnpm drizzle-kit push:pg

# View migration status
pnpm drizzle-kit status
```

---

## Monitoring & Alerting (Future)

### Recommended Stack

| Tool | Purpose |
|------|---------|
| **Sentry** | Error tracking |
| **Datadog/New Relic** | APM & metrics |
| **PagerDuty** | Incident alerting |
| **UptimeRobot** | Availability monitoring |

### Key Metrics to Monitor

- Error rate
- Response time (p50, p95, p99)
- Active users
- Database connection pool
- Electric sync latency

---

## Disaster Recovery (Future)

### Backup Strategy

| Data | Backup Frequency | Retention |
|------|------------------|-----------|
| PostgreSQL | Daily | 30 days |
| User uploads | Daily | 90 days |
| Config/secrets | On change | Indefinite |

### Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Single region failure | 15 min | 0 min (multi-region) |
| Data corruption | 1 hour | 24 hours (daily backup) |
| Complete outage | 4 hours | 24 hours |

---

## Version Control

### Branch Strategy

```
main          ─────────────────────────────────────────────▶
                    ╱           ╲           ╱
feature/xyz   ─────●─────●─────●──────────▶ (merged via PR)
```

### Using Jujutsu (jj)

```bash
# View commit history
jj log

# Create new change
jj new -m "Add feature X"

# Push to remote
jj git push

# Create branch for PR
jj branch create feature/my-feature
jj git push --branch feature/my-feature
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`just bombadil-quick`)
- [ ] TypeScript compiles (`pnpm exec tsc --noEmit`)
- [ ] No console errors in dev
- [ ] Bundle size acceptable
- [ ] Responsive design tested

### Post-Deployment

- [ ] Smoke test passed
- [ ] No new errors in monitoring
- [ ] Performance metrics stable
- [ ] User-facing features work

### Rollback Triggers

- [ ] Error rate > 5%
- [ ] LCP > 4s
- [ ] Critical feature broken
- [ ] Security vulnerability found
