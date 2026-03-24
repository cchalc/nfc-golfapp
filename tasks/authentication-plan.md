# Authentication Plan: Magic Link Email Login

## Inspiration: Fizzy's Auth Model

From [Basecamp's Fizzy](https://github.com/basecamp/fizzy):

- **Identity** - Global email identity, can span multiple accounts
- **User** - Account membership with roles (owner, admin, member)
- **Session** - Simple token tied to identity
- **MagicLink** - 6-character code, 15-minute expiry, one-time use

**Flow:**
1. User enters email → magic link with 6-char code sent
2. User enters code within 15 minutes
3. Session created, stored in HttpOnly cookie
4. User accesses their accounts

## Our Adaptation for Golf App

### Simplified Model

Instead of Fizzy's Account/User separation, we use:

```
Identity (email-based, global)
├── Sessions (auth tokens)
└── MagicLinks (login codes)

Trip (our "account")
└── TripGolfer (membership)
    └── golferId → links to Golfer
    └── Golfer.email → matches Identity.email
```

### Role Model

| Role | Can Do |
|------|--------|
| **Organizer** | Create trips, invite golfers, manage rounds, manage teams/challenges |
| **Participant** | View their trips, enter scores, view leaderboards/challenges |

Organizer = TripGolfer where `golferId` matches `Trip.createdBy` OR has `isOrganizer: true`

### User Experience

**Organizer Flow:**
1. Sign in with email (magic link)
2. See all trips they created/organize
3. Full management UI (current app)

**Participant Flow:**
1. Receive trip invite email with magic link
2. Click link → signs in and sees trip
3. Simplified UI:
   - My Trips (only trips they're in)
   - Score Entry (current round, quick entry)
   - Leaderboard (read-only)
   - Challenges (view, maybe claim results)

---

## Implementation Phases

### Phase 1: Database Schema

**New tables:**

```sql
-- Global email identities
CREATE TABLE identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auth sessions (cookie-based)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Magic link codes
CREATE TABLE magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'sign_in', -- sign_in, trip_invite
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE, -- for invites
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link golfers to identities (optional, for existing golfers)
ALTER TABLE golfers ADD COLUMN identity_id UUID REFERENCES identities(id);
```

**Modify existing:**
```sql
-- Add organizer flag to trip_golfers
ALTER TABLE trip_golfers ADD COLUMN is_organizer BOOLEAN NOT NULL DEFAULT false;
```

### Phase 2: Server Auth Logic

**Files to create:**

| File | Purpose |
|------|---------|
| `src/server/auth/identity.ts` | Find/create identity by email |
| `src/server/auth/magic-link.ts` | Generate code, send email, consume |
| `src/server/auth/session.ts` | Create/validate/destroy sessions |
| `src/server/auth/middleware.ts` | Auth middleware for protected routes |
| `src/server/auth/email.ts` | Send magic link emails (Resend/Postmark) |

**Magic Link Flow:**
```typescript
// 1. Request login
POST /api/auth/login
{ email: "golfer@example.com" }
→ Generate 6-char code, expires in 15 min
→ Send email with code
→ Return { success: true }

// 2. Verify code
POST /api/auth/verify
{ email: "golfer@example.com", code: "ABC123" }
→ Validate code exists, not expired
→ Create session, set HttpOnly cookie
→ Return { success: true, user: { ... } }

// 3. Check session
GET /api/auth/me
→ Read session cookie
→ Return current user or 401

// 4. Logout
POST /api/auth/logout
→ Destroy session, clear cookie
→ Return { success: true }
```

### Phase 3: Client Auth State

**TanStack DB collection for auth state:**

```typescript
// src/db/auth.ts
export const authSchema = z.object({
  id: z.literal('current'),
  isAuthenticated: z.boolean(),
  identity: z.object({
    id: z.string(),
    email: z.string(),
  }).nullable(),
  golfer: golferSchema.nullable(), // linked golfer profile
  isLoading: z.boolean(),
})

export const authCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: () => 'current',
    schema: authSchema,
    initialData: [{
      id: 'current',
      isAuthenticated: false,
      identity: null,
      golfer: null,
      isLoading: true,
    }],
  })
)
```

### Phase 4: Auth UI Components

**Files to create:**

| Component | Purpose |
|-----------|---------|
| `LoginPage.tsx` | Email input, "Send code" button |
| `VerifyCodePage.tsx` | 6-digit code input |
| `AuthProvider.tsx` | Check session on load, provide context |
| `ProtectedRoute.tsx` | Redirect to login if not authenticated |
| `UserMenu.tsx` | Show email, logout button in header |

**Login flow UI:**
1. `/login` - Enter email
2. `/login/verify` - Enter 6-char code (with countdown timer)
3. Redirect to `/` on success

### Phase 5: Trip Invites

**Invite flow:**
1. Organizer adds golfer email to trip
2. System creates TripGolfer with status `invited`
3. If golfer doesn't exist, create with email
4. Send magic link email with `purpose: trip_invite`
5. Clicking link → signs in AND accepts invite

**Email template:**
```
Subject: You're invited to Kelowna Golf Trip 2024

Hey!

You've been invited to join "Kelowna Golf Trip 2024" on Golf Trip.

Click below to join and start tracking your scores:

[Join Trip →] (magic link)

This link expires in 24 hours.
```

### Phase 6: Simplified Participant UI

**New routes for participants:**

| Route | View |
|-------|------|
| `/my-trips` | List of trips user is in |
| `/my-trips/$tripId` | Trip overview (simplified) |
| `/my-trips/$tripId/scores` | Quick score entry for current round |
| `/my-trips/$tripId/leaderboard` | Read-only leaderboard |

**UI differences:**
- No "Create Trip" button
- No round/team/challenge management
- Simplified scorecard (just their scores)
- Big touch targets for on-course use

---

## Tech Decisions

### Email Provider
**Resend** - Simple API, good deliverability, free tier (100 emails/day)

```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'Golf Trip <noreply@golftrip.app>',
  to: email,
  subject: 'Your login code',
  html: `Your code is: <strong>${code}</strong>`,
})
```

### Session Storage
**HttpOnly cookies** - Secure, automatic on every request

```typescript
// Set session cookie
setCookie('session_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30 days
})
```

### Code Generation
**6 alphanumeric characters** - Easy to type on mobile

```typescript
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I, O, 0, 1
const code = Array.from({ length: 6 }, () =>
  CHARS[Math.floor(Math.random() * CHARS.length)]
).join('')
```

---

## File Summary

### New Files
```
src/
├── db/
│   └── auth.ts                    # Auth state collection
├── server/
│   └── auth/
│       ├── identity.ts            # Identity CRUD
│       ├── magic-link.ts          # Magic link logic
│       ├── session.ts             # Session management
│       ├── middleware.ts          # Auth middleware
│       └── email.ts               # Email sending
├── components/
│   └── auth/
│       ├── LoginPage.tsx          # Email entry
│       ├── VerifyCodePage.tsx     # Code verification
│       ├── AuthProvider.tsx       # Auth context
│       ├── ProtectedRoute.tsx     # Route guard
│       └── UserMenu.tsx           # Header user menu
└── routes/
    ├── login.tsx                  # Login page route
    ├── login.verify.tsx           # Verify code route
    └── my-trips/                  # Participant routes
        ├── index.tsx
        └── $tripId/
            ├── index.tsx
            ├── scores.tsx
            └── leaderboard.tsx
```

### Modified Files
```
src/
├── db/
│   └── drizzle/
│       └── schema.ts              # Add identities, sessions, magic_links
├── components/
│   └── Header.tsx                 # Add UserMenu
└── routes/
    └── __root.tsx                 # Add AuthProvider
```

---

## Environment Variables

```bash
# Email
RESEND_API_KEY=re_xxxxx

# Session
SESSION_SECRET=random-32-char-string

# App URL (for magic links)
APP_URL=https://golftrip.app
```

---

## Testing Plan

1. **Unit tests** - Code generation, session validation
2. **Integration tests** - Full magic link flow
3. **E2E tests** - Login, enter scores, logout

---

## Open Questions

1. **Golfer linking** - Auto-link identity to golfer by email? Or manual?
2. **Multiple organizers** - Allow trip creator to designate others as organizers?
3. **Invite expiry** - How long should trip invite links be valid? (24h? 7 days?)
4. **Existing sessions** - Allow multiple sessions per identity? (Yes for multi-device)
