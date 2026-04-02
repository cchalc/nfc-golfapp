# Checkpoint: Magic Link Authentication - 2026-03-25

## Branch
`authentication` - pushed to origin

## What Was Implemented

### Phase 7.3: Magic Link Authentication (COMPLETE)

Passwordless authentication inspired by [Basecamp Fizzy](https://github.com/basecamp/fizzy/blob/main/AGENTS.md).

#### Database Schema
- **Migration**: `src/db/drizzle/migrations/0002_authentication.sql`
- **Tables created**:
  - `identities` - authenticated users with email, linked to golfer
  - `sessions` - HttpOnly cookie sessions, 30-day expiry
  - `magic_links` - 6-char codes, 15-min expiry
  - `trip_organizers` - owner/organizer roles per trip
  - `trip_invites` - 7-day invite links with optional max uses

#### Server Auth Functions (`src/server/auth/`)
- `utils.ts` - Code/token generation, cookie helpers, request parsing
- `mutations.ts` - requestMagicLink, verifyMagicLink, getSession, logout
- `authorization.ts` - getTripRole, requireOrganizer, requireTripAccess, canManageGolferScores
- `invites.ts` - createTripInvite, acceptTripInvite, getInviteInfo, listTripInvites, deleteTripInvite

#### Collections & Electric Sync
- `identityCollection` - read-only sync from server
- `tripOrganizerCollection` - full CRUD with Electric sync
- `tripInviteCollection` - full CRUD with Electric sync
- Electric proxy routes in `src/routes/api/electric/`

#### Client-Side Auth
- `AuthContext.tsx` - session state, refresh, signOut
- `useRequireAuth.ts` - redirect to /login if not authenticated
- `useTripRole.ts` - get user's role for a trip (owner/organizer/participant/none)

#### UI Components
- `UserMenu.tsx` - Header dropdown with avatar, email, sign out
- `/login` - Email entry form
- `/login/verify` - 6-char code input with 15-min countdown
- `/invite/$token` - Trip invite acceptance page

#### Auto-Organizer on Trip Creation
- `insertTrip` mutation now auto-adds creator as 'owner' in trip_organizers

## Files Created (26 files)

```
src/
├── components/auth/
│   └── UserMenu.tsx
├── contexts/
│   └── AuthContext.tsx
├── db/drizzle/migrations/
│   └── 0002_authentication.sql
├── hooks/
│   ├── useRequireAuth.ts
│   └── useTripRole.ts
├── routes/
│   ├── api/electric/
│   │   ├── identities.ts
│   │   ├── trip-invites.ts
│   │   └── trip-organizers.ts
│   ├── invite.$token.tsx
│   ├── login.tsx
│   └── login.verify.tsx
└── server/
    ├── auth/
    │   ├── authorization.ts
    │   ├── index.ts
    │   ├── invites.ts
    │   ├── mutations.ts
    │   └── utils.ts
    └── mutations/
        ├── trip-invites.ts
        └── trip-organizers.ts
```

## Files Modified (7 files)

- `src/components/Header.tsx` - Added UserMenu
- `src/contexts/AuthContext.tsx` - New file
- `src/db/collections.ts` - Added auth schemas and collections
- `src/db/drizzle/schema.ts` - Added auth table definitions
- `src/routes/__root.tsx` - Wrapped with AuthProvider
- `src/server/mutations/index.ts` - Export new mutations
- `src/server/mutations/trips.ts` - Auto-add creator as organizer

## Environment Variables Needed

```fish
# .envrc
export RESEND_API_KEY="re_xxxxxxxxxxxx"  # Optional - emails log to console without this
export APP_URL="http://localhost:5173"   # For invite link URLs
```

## To Resume: Next Steps

### 1. Run the Migration
```fish
psql "$DATABASE_URL" -f src/db/drizzle/migrations/0002_authentication.sql
```

### 2. Test Auth Flow
1. Go to `/login`, enter email
2. Check console for magic code (if RESEND_API_KEY not set)
3. Enter code at `/login/verify`
4. Verify session cookie set, redirected to home
5. Check UserMenu shows email and logout

### 3. Test Auto-Linking
1. Create a golfer with email "test@example.com"
2. Login with "test@example.com"
3. Verify identity.golfer_id matches the golfer

### 4. Test Trip Invite
1. As organizer, need to add UI for creating invite links
2. Open invite link in incognito, login with new email
3. Accept invite, verify added to trip_golfers

### 5. Implement Role-Based UI (Phase 7.4)
- Wire up `useTripRole` hook to trip management UI
- Hide management controls for participants
- Only show "Enter Results" for their own scores
- Example:
```tsx
function TripDashboard() {
  const { tripId } = Route.useParams()
  const { canManage } = useTripRole(tripId)

  return (
    <>
      {canManage && <TripManagementControls />}
      <TripOverview />
      <Leaderboard />
    </>
  )
}
```

### 6. Add Invite UI for Organizers
- Create "Invite" button in trip settings
- Show copy-able invite URL
- List active invites with delete option

## Known Issues / TODOs

1. **No invite creation UI yet** - Server functions exist but no UI to create/manage invites
2. **Role-based UI not wired up** - `useTripRole` hook exists but not used in trip pages
3. **Email templates basic** - Just plain HTML, could use nicer formatting
4. **No "remember me" option** - Sessions always 30 days
5. **No session listing/management** - Can't see/revoke other sessions

## Type Check Status

All auth-related files pass type check. Pre-existing errors in challenge components unrelated to auth work.
