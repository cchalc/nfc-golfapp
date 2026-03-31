# Authentication & Authorization System

This document describes the complete authentication and authorization system implemented for the Golf Trip Planner application.

## Overview

The application uses a **magic link email authentication** system with **role-based authorization** for trip access control.

### User Roles

- **Organizer**: Full access to create and manage trips, rounds, challenges, and all golfer scores
- **Participant**: View trips, enter their own scores, view leaderboards (read-only for management controls)

### Technology Stack

- **Authentication**: Magic link codes sent via email (6-character alphanumeric codes)
- **Sessions**: Cookie-based sessions with 30-day expiry
- **Database**: PostgreSQL with Electric SQL sync
- **Authorization**: Role-based access control (RBAC) via `useTripRole` hook

---

## Database Schema

### Authentication Tables

#### `identities`
User identity records with optional golfer linkage.

```sql
CREATE TABLE identities (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  golfer_id UUID REFERENCES golfers(id),
  role TEXT NOT NULL CHECK (role IN ('organizer', 'participant')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `sessions`
Active user sessions.

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  identity_id UUID NOT NULL REFERENCES identities(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `magic_links`
One-time use magic link verification codes.

```sql
CREATE TABLE magic_links (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `trip_organizers`
Maps identities to trips they organize.

```sql
CREATE TABLE trip_organizers (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id),
  identity_id UUID NOT NULL REFERENCES identities(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, identity_id)
);
```

#### `trip_invites`
Invitation tokens for joining trips as participants.

```sql
CREATE TABLE trip_invites (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Authentication Flow

### 1. Login Request

User enters their email address at `/login`.

```tsx
// POST /api/auth/login
{
  email: "user@example.com"
}
```

**Server Actions:**
1. Generates 6-character alphanumeric code
2. Stores code in `magic_links` table with 15-minute expiry
3. Sends email with code (via Resend API)
4. Returns success

### 2. Code Verification

User enters the code received via email at `/login/verify`.

```tsx
// POST /api/auth/verify
{
  email: "user@example.com",
  code: "ABC123"
}
```

**Server Actions:**
1. Validates code exists and hasn't expired
2. Marks code as used
3. Finds or creates identity record
4. Auto-links to existing golfer if email matches
5. Creates session token (30-day expiry)
6. Sets `golf_session` cookie
7. Redirects to intended destination (or home)

### 3. Session Management

On every request, the session is validated:

```tsx
// GET /api/auth/me
// Returns: { id, email, golferId, role } or null
```

**Server Actions:**
1. Reads `golf_session` cookie
2. Validates session token in database
3. Checks session hasn't expired
4. Returns identity data or null

### 4. Logout

User clicks "Sign Out" in UserMenu.

```tsx
// POST /api/auth/logout
```

**Server Actions:**
1. Deletes session from database
2. Clears `golf_session` cookie
3. Redirects to home page

---

## Authorization System

### Trip Role Hierarchy

1. **Organizer** - Created the trip or added via `trip_organizers`
   - Can manage all trip settings
   - Can edit all golfer scores
   - Can create/delete rounds and challenges
   - Can add/remove golfers and teams

2. **Participant** - Invited via `trip_invites` or added as golfer
   - Can view trip details
   - Can edit ONLY their own scores
   - Cannot create/delete/modify trip resources
   - Read-only access to leaderboards and challenges

3. **None** - No access to trip
   - Shows "Access Denied" message
   - Cannot view any trip data

### `useTripRole` Hook

Central authorization hook used across all trip routes.

```tsx
import { useTripRole } from '../hooks/useTripRole'

function TripPage() {
  const { tripId } = Route.useParams()
  const { role, canManage, access, isLoading } = useTripRole(tripId)

  // role: 'organizer' | 'participant' | 'none'
  // canManage: boolean (true for organizers)
  // access: { golferId: string | null }
  // isLoading: boolean
}
```

**Authorization Logic:**

```typescript
// Server function: getTripRole(tripId, identityId)
// 1. Check if identity is in trip_organizers → 'organizer'
// 2. Check if identity.golferId is in trip_golfers → 'participant'
// 3. Otherwise → 'none'
```

### `useRequireAuth` Hook

Redirects unauthenticated users to login page.

```tsx
import { useRequireAuth } from '../hooks/useRequireAuth'

function ProtectedPage() {
  useRequireAuth() // Redirects to /login if not authenticated

  // Rest of component only renders for authenticated users
}
```

**Behavior:**
- Checks if `session` exists in AuthContext
- If not authenticated, redirects to `/login?redirect={currentPath}`
- After login, user is redirected back to intended page

---

## Route Protection

### Route Categories

#### Public Routes (No Auth Required)
- `/` - Home page (shows sign-in CTA if not authenticated)
- `/login` - Login page
- `/login/verify` - Code verification page
- `/invite/$token` - Trip invitation acceptance

#### Global Resources (Authenticated Only)
All authenticated users can access:
- `/trips` - List all trips
- `/trips/new` - Create new trip
- `/golfers` - List all golfers
- `/golfers/$golferId` - Golfer details
- `/courses` - List all courses
- `/courses/$courseId` - Course details

#### Trip-Scoped Routes (Authenticated + Role Check)
Access controlled by trip role:
- `/trips/$tripId` - Trip dashboard
- `/trips/$tripId/golfers` - Golfer management
- `/trips/$tripId/teams` - Team management
- `/trips/$tripId/challenges` - Challenges
- `/trips/$tripId/leaderboards` - Leaderboards
- `/trips/$tripId/rounds` - Rounds list
- `/trips/$tripId/rounds/new` - Create round
- `/trips/$tripId/rounds/$roundId` - Round overview
- `/trips/$tripId/rounds/$roundId/scorecard` - Score entry

### Route Protection Pattern

```tsx
export const Route = createFileRoute('/trips/$tripId/...')({
  ssr: false,
  component: ProtectedComponent,
})

function ProtectedComponent() {
  const { tripId } = Route.useParams()

  // 1. Require authentication
  useRequireAuth()

  // 2. Check trip role
  const { role, isLoading, canManage } = useTripRole(tripId)

  // 3. Show loading state
  if (isLoading) {
    return <Spinner />
  }

  // 4. Handle no access
  if (role === 'none') {
    return <Text>Access Denied</Text>
  }

  // 5. Render with role-based UI
  return (
    <>
      {canManage && <ManagementControls />}
      <PublicContent />
    </>
  )
}
```

---

## UI Authorization Patterns

### Management Controls

Hide buttons from participants using conditional rendering:

```tsx
const { canManage } = useTripRole(tripId)

// Only organizers see these buttons
{canManage && (
  <Button onClick={deleteTrip}>Delete Trip</Button>
)}

{canManage && (
  <Button onClick={addGolfer}>Add Golfer</Button>
)}

{canManage && (
  <Button onClick={createRound}>Create Round</Button>
)}
```

### Per-Golfer Score Editing

Critical authorization for scorecard:

```tsx
const { tripId } = Route.useParams()
const { golferId } = Route.useSearch()
const { access, canManage } = useTripRole(tripId)

function canEditGolfer(targetGolferId: string): boolean {
  // Organizers can edit any golfer
  // Participants can only edit their own scores
  return canManage || access.golferId === targetGolferId
}

<Scorecard
  readOnly={!canEditGolfer(golferId)}
  onScoreChange={handleScoreChange}
/>
```

### Component Props

Score input components accept `readOnly` prop:

```tsx
// Scorecard.tsx
interface ScorecardProps {
  readOnly?: boolean
  // ... other props
}

// ScoreEntry.tsx
interface ScoreEntryProps {
  readOnly?: boolean
  // ... other props
}

<TextField.Root disabled={readOnly}>
  <TextField.Input />
</TextField.Root>
```

---

## Authorization Matrix

| Action | Organizer | Participant | Not in Trip |
|--------|-----------|-------------|-------------|
| View trip dashboard | ✅ | ✅ | ❌ |
| View leaderboards | ✅ | ✅ | ❌ |
| View challenges | ✅ | ✅ | ❌ |
| Delete trip | ✅ | ❌ | ❌ |
| Add/remove golfers | ✅ | ❌ | ❌ |
| Create/delete rounds | ✅ | ❌ | ❌ |
| Create/edit challenges | ✅ | ❌ | ❌ |
| Edit own scores | ✅ | ✅ | ❌ |
| Edit other golfer scores | ✅ | ❌ | ❌ |
| Manage teams | ✅ | ❌ | ❌ |
| Toggle scoring inclusion | ✅ | ❌ | ❌ |

---

## Server Functions

### Authentication Mutations

Located in `src/server/auth/mutations.ts`:

```typescript
// Request magic link code
export const requestMagicLink = createServerFn()
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data: { email } }) => {
    // Generate code, store in DB, send email
  })

// Verify code and create session
export const verifyMagicLink = createServerFn()
  .inputValidator((data: { email: string; code: string }) => data)
  .handler(async ({ data: { email, code } }) => {
    // Validate code, create/find identity, create session
  })

// Get current session
export const getSession = createServerFn()
  .handler(async () => {
    // Read cookie, validate session, return identity
  })

// Logout user
export const logout = createServerFn()
  .handler(async () => {
    // Delete session, clear cookie
  })
```

### Authorization Functions

Located in `src/server/auth/authorization.ts`:

```typescript
// Get user's role for a trip
export const getTripRole = createServerFn()
  .inputValidator((data: { tripId: string }) => data)
  .handler(async ({ data: { tripId } }) => {
    // Check organizers table, then golfers table
    // Return: { role, access: { golferId } }
  })

// Require organizer role (throws if not)
export const requireOrganizer = createServerFn()
  .inputValidator((data: { tripId: string }) => data)
  .handler(async ({ data: { tripId } }) => {
    // Validate organizer or throw error
  })

// Check if user can manage golfer's scores
export const canManageGolferScores = createServerFn()
  .inputValidator((data: { tripId: string; golferId: string }) => data)
  .handler(async ({ data: { tripId, golferId } }) => {
    // Organizer = true, participant = only if their golfer
  })
```

---

## Testing Scenarios

### Manual Testing Checklist

#### Authentication Flow
- [ ] Request magic link with valid email
- [ ] Receive email with 6-digit code
- [ ] Verify code successfully creates session
- [ ] Session persists across page reloads
- [ ] Logout clears session and redirects to home
- [ ] Invalid code shows error message
- [ ] Expired code (15min+) is rejected

#### Organizer Capabilities
- [ ] Create new trip
- [ ] Add golfers to trip
- [ ] Create rounds and courses
- [ ] Enter scores for ANY golfer
- [ ] Edit scores for ANY golfer
- [ ] Delete trips, rounds, challenges
- [ ] Manage teams (create, delete, add members)
- [ ] Toggle round/golfer scoring inclusion
- [ ] All management buttons visible

#### Participant Restrictions
- [ ] Can view trip dashboard
- [ ] Can view leaderboards (read-only)
- [ ] Can view challenges (read-only)
- [ ] Can enter/edit ONLY own scores
- [ ] Cannot see "Delete Trip" button
- [ ] Cannot see "Add Golfer" button
- [ ] Cannot see "Create Round" button
- [ ] Cannot see "Create Challenge" button
- [ ] Cannot edit other golfer scores (inputs disabled)
- [ ] Redirected from `/rounds/new` if accessed directly

#### Access Denial
- [ ] Non-authenticated users redirected to `/login`
- [ ] Users not in trip see "Access Denied"
- [ ] Redirect preserves intended destination
- [ ] Login returns user to intended page

#### Auto-Linking
- [ ] New golfer with email auto-links on first login
- [ ] Existing golfer auto-links if email matches
- [ ] Identity gets participant role if linked to golfer in trip

### Multi-User Testing

Test with two browsers simultaneously:

1. **Browser A (Organizer)**
   - Create trip
   - Add rounds
   - Enter scores

2. **Browser B (Participant)**
   - Accept invite
   - View trip (verify read-only)
   - Enter own scores only
   - Watch leaderboard update in real-time

3. **Verify Real-Time Sync**
   - Organizer enters score → Participant sees update < 2s
   - Participant enters own score → Organizer sees update < 2s
   - Leaderboard recalculates automatically

---

## Security Considerations

### Session Security
- **HTTP-only cookies**: Session token not accessible via JavaScript
- **30-day expiry**: Sessions automatically expire
- **Secure flag**: Cookies only sent over HTTPS in production
- **Token rotation**: Could be added for enhanced security

### Magic Link Security
- **15-minute expiry**: Codes expire quickly
- **Single-use**: Code marked as used after verification
- **6-character codes**: ~57 billion combinations (36^6)
- **Rate limiting**: Should be added to prevent brute force

### Authorization Security
- **Server-side validation**: All role checks performed on server
- **UI hiding alone is insufficient**: Backend enforces permissions
- **Trip isolation**: Users can only access trips they're in
- **Golfer isolation**: Participants can only edit their own scores

### Recommendations
1. Add rate limiting on magic link requests (e.g., max 3/hour per email)
2. Add CAPTCHA on login page to prevent bot abuse
3. Implement session token rotation on sensitive operations
4. Add audit logging for organizer actions (delete trip, etc.)
5. Consider 2FA for organizer accounts
6. Add email verification on first signup

---

## Implementation Details

### Files Modified

#### Routes (16 files)
- `src/routes/index.tsx` - Added sign-in CTA
- `src/routes/trips/index.tsx` - Auth guard
- `src/routes/trips/new.tsx` - Auth guard
- `src/routes/trips/$tripId/index.tsx` - Auth + authz
- `src/routes/trips/$tripId/golfers.tsx` - Auth + authz
- `src/routes/trips/$tripId/teams.tsx` - Auth + authz
- `src/routes/trips/$tripId/challenges.tsx` - Auth + authz
- `src/routes/trips/$tripId/leaderboards.tsx` - Auth + authz
- `src/routes/trips/$tripId/rounds/index.tsx` - Auth + authz
- `src/routes/trips/$tripId/rounds/new.tsx` - Auth + authz
- `src/routes/trips/$tripId/rounds/$roundId/index.tsx` - Auth + authz
- `src/routes/trips/$tripId/rounds/$roundId/scorecard.tsx` - Auth + per-golfer authz
- `src/routes/golfers/index.tsx` - Auth guard
- `src/routes/golfers/$golferId.tsx` - Auth guard
- `src/routes/courses/index.tsx` - Auth guard
- `src/routes/courses/$courseId.tsx` - Auth guard

#### Components (2 files)
- `src/components/scoring/Scorecard.tsx` - Added `readOnly` prop
- `src/components/scoring/ScoreEntry.tsx` - Added `readOnly` prop

#### Hooks (3 files)
- `src/hooks/useAuth.ts` - Authentication hook (existing)
- `src/hooks/useRequireAuth.ts` - Route protection hook (existing)
- `src/hooks/useTripRole.ts` - Authorization hook (existing)

#### Server (3 files)
- `src/server/auth/mutations.ts` - Auth server functions (existing)
- `src/server/auth/authorization.ts` - Authz server functions (existing)
- `src/server/auth/utils.ts` - Helper utilities (existing)

#### Contexts (1 file)
- `src/contexts/AuthContext.tsx` - Auth context provider (existing)

#### Database (1 file)
- `src/db/drizzle/migrations/0002_authentication.sql` - Auth schema (existing)

### Commits

1. **Phase 7.2b**: `b1c3936c` - "Add route protection to all authenticated routes"
   - Added `useRequireAuth()` to all authenticated routes
   - Added `useTripRole()` to trip-scoped routes
   - Added loading and access denial states

2. **Phase 7.4**: `69d959eb` - "Add role-based authorization UI to all trip routes"
   - Added `canManage` checks to all management buttons
   - Implemented per-golfer score editing permissions
   - Added `readOnly` prop to score input components

---

## Future Enhancements

### Planned Features
1. **Email Templates**: Branded magic link emails
2. **Invite Management**: Dashboard for pending invites
3. **Role Promotion**: Allow promoting participants to organizers
4. **Audit Log**: Track all organizer actions
5. **2FA**: Two-factor authentication for organizers
6. **Session Management**: View/revoke active sessions
7. **Permission Presets**: Common permission templates

### Potential Improvements
1. **Granular Permissions**: More fine-grained role controls
2. **Team-Based Permissions**: Team captains with limited management
3. **Time-Limited Access**: Invites that expire after trip completion
4. **Read-Only Organizers**: View-only organizer role for observers
5. **Bulk Invitations**: Invite multiple emails at once
6. **OAuth Integration**: Google/Apple sign-in options

---

## Troubleshooting

### Common Issues

#### "Session expired" after login
- **Cause**: Server time mismatch or cookie not set
- **Solution**: Check `expires_at` in sessions table, verify cookie domain

#### "Access Denied" for organizer
- **Cause**: Not in `trip_organizers` table
- **Solution**: Verify organizer record exists for trip

#### Can't edit own scores as participant
- **Cause**: `identity.golfer_id` not set
- **Solution**: Auto-link should happen on login, verify email matches

#### Magic link code not working
- **Cause**: Code expired (>15 min) or already used
- **Solution**: Request new code

#### Real-time updates not working
- **Cause**: Electric SQL sync issue
- **Solution**: Check Electric proxy routes, verify `DATABASE_URL_DIRECT`

### Debug Queries

```sql
-- Check user's identity
SELECT * FROM identities WHERE email = 'user@example.com';

-- Check active sessions
SELECT s.*, i.email
FROM sessions s
JOIN identities i ON s.identity_id = i.id
WHERE s.expires_at > NOW();

-- Check trip organizers
SELECT t.name, i.email
FROM trip_organizers to_
JOIN trips t ON to_.trip_id = t.id
JOIN identities i ON to_.identity_id = i.id;

-- Check pending invites
SELECT ti.email, t.name, ti.status
FROM trip_invites ti
JOIN trips t ON ti.trip_id = t.id
WHERE ti.expires_at > NOW();
```

---

## Conclusion

The authentication and authorization system is now fully implemented with:
- ✅ Magic link email authentication
- ✅ Role-based access control (organizer/participant)
- ✅ Route protection for all authenticated routes
- ✅ UI authorization for management controls
- ✅ Per-golfer score editing permissions
- ✅ Session management with 30-day expiry
- ✅ Real-time sync via Electric SQL

All 16 routes are protected, 10 routes have role-based UI controls, and scorecard editing enforces per-golfer permissions. The system is ready for production use with manual testing and potential security enhancements recommended above.
