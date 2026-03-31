# Changelog

All notable changes to the Golf Trip Planner project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Authentication & Authorization System (2026-03-31)

#### Phase 7.2b: Route Protection
- **Authentication guards on all routes** (`b1c3936c`)
  - Added `useRequireAuth()` hook to redirect unauthenticated users
  - Implemented redirect preservation for post-login return
  - Added loading states during authentication checks
  - Added "Access Denied" messaging for unauthorized access

- **Public routes** (no authentication required)
  - Home page `/` with sign-in CTA for unauthenticated users
  - Login flow pages `/login` and `/login/verify`
  - Trip invitation acceptance `/invite/$token`

- **Global resource routes** (authentication required)
  - Trips list and creation (`/trips`, `/trips/new`)
  - Golfers management (`/golfers`, `/golfers/$golferId`)
  - Courses management (`/courses`, `/courses/$courseId`)

- **Trip-scoped routes** (authentication + role check)
  - Trip dashboard (`/trips/$tripId`)
  - Golfer management (`/trips/$tripId/golfers`)
  - Team management (`/trips/$tripId/teams`)
  - Challenges (`/trips/$tripId/challenges`)
  - Leaderboards (`/trips/$tripId/leaderboards`)
  - Rounds list (`/trips/$tripId/rounds`)
  - Round creation (`/trips/$tripId/rounds/new`)
  - Round overview (`/trips/$tripId/rounds/$roundId`)
  - Scorecard (`/trips/$tripId/rounds/$roundId/scorecard`)

#### Phase 7.4: Authorization UI
- **Role-based UI controls** (`69d959eb`)
  - Conditional rendering of management buttons based on `canManage` permission
  - Organizers see full CRUD controls
  - Participants see read-only views with limited editing

- **Trip management authorization**
  - Hide delete trip button from participants
  - Hide add/remove golfer controls from participants
  - Hide team management (create, delete, modify) from participants
  - Hide round creation/deletion from participants
  - Hide challenge creation/editing from participants

- **Per-golfer score editing permissions**
  - Organizers can edit ALL golfer scores
  - Participants can ONLY edit their own scores
  - Score inputs disabled via `readOnly` prop for unauthorized editing
  - Added `readOnly` prop to `Scorecard` component
  - Added `readOnly` prop to `ScoreEntry` component

- **Enhanced user experience**
  - Non-organizers redirected from restricted pages
  - Clear visual distinction between editable and read-only fields
  - Consistent authorization patterns across all routes
  - Loading states during permission checks

### Changed
- **Routes**: 16 route files updated with authentication and authorization
- **Components**: 2 scoring components updated with `readOnly` support
- **Hooks**: Leveraged existing `useAuth`, `useRequireAuth`, `useTripRole` hooks

### Database Schema
- Authentication tables already migrated via `0002_authentication.sql`:
  - `identities` - User accounts with optional golfer linkage
  - `sessions` - Active user sessions (30-day expiry)
  - `magic_links` - One-time magic link codes (15-min expiry)
  - `trip_organizers` - Maps identities to managed trips
  - `trip_invites` - Invitation tokens for trip participation

### Security
- Magic link authentication with 6-character codes
- HTTP-only session cookies
- Server-side authorization validation
- Trip access isolation (users only access trips they're in)
- Per-golfer score editing enforcement

### Documentation
- Added comprehensive `docs/authentication-authorization.md`
  - Database schema documentation
  - Authentication flow diagrams
  - Authorization patterns and examples
  - Route protection reference
  - UI authorization patterns
  - Authorization matrix
  - Testing scenarios
  - Security considerations
  - Troubleshooting guide

### Performance
- Parallel implementation using Jujutsu workspaces
- Reduced execution time from 5.75 hours to 2.5 hours (2.3x speedup)
- 6 subagents executed in parallel across 2 phases

### Statistics
- **Files changed**: 21 (16 routes + 2 components + 3 config)
- **Lines changed**: ~1,000 (573 insertions, 505 deletions)
- **Routes protected**: 16 routes with authentication
- **Routes with authz**: 10 routes with role-based UI
- **Components updated**: 2 scoring components with `readOnly` support

---

## [0.1.0] - 2026-03-25

### Added - Initial Implementation
- Electric SQL sync with Neon PostgreSQL
- TanStack Start framework with TanStack Router
- Real-time data synchronization
- Trip management (create, view, delete)
- Golfer management
- Course management
- Round creation and scoring
- Scorecard interface with Stableford scoring
- Leaderboards (Stableford, Net, Birdies, KPs)
- Team management
- Challenges system
- Offline support with optimistic updates
- Radix UI design system
- Responsive mobile-first design

### Technical Stack
- **Frontend**: React 19, TanStack Start, TanStack Router, TanStack DB
- **Backend**: TanStack Start server functions, Neon PostgreSQL
- **Sync**: Electric SQL v0.15.1 with progressive sync mode
- **UI**: Radix UI Themes, Tailwind CSS
- **Validation**: Zod schemas
- **Build**: Vite, Biome (linting/formatting)
- **Version Control**: Jujutsu

---

## Release Notes

### v0.2.0 (Unreleased) - Authentication & Authorization Release

This release introduces a complete authentication and authorization system:

**Key Features:**
- Magic link email authentication
- Role-based access control (Organizer/Participant)
- Route-level protection for all authenticated pages
- UI-level authorization for management controls
- Per-golfer score editing permissions

**User Roles:**
- **Organizer**: Full management access to trips, rounds, challenges
- **Participant**: View-only access with personal score editing

**Security:**
- Cookie-based sessions with 30-day expiry
- One-time use magic link codes with 15-minute expiry
- Server-side authorization validation
- HTTP-only secure cookies

**Breaking Changes:**
- None - authentication is additive, existing data remains accessible

**Migration Required:**
- Run `0002_authentication.sql` migration (already applied in testing)

**Testing Recommendations:**
1. Test magic link flow (request → verify → session)
2. Test organizer capabilities (full CRUD access)
3. Test participant restrictions (view-only + own scores)
4. Test access denial for non-trip members
5. Test real-time sync between concurrent users

**Known Limitations:**
- No rate limiting on magic link requests (recommended for production)
- No 2FA option (recommended for organizer accounts)
- No session management UI (view/revoke active sessions)
- No audit logging for organizer actions

**Next Steps:**
- Add rate limiting on authentication endpoints
- Add CAPTCHA on login page
- Implement audit logging
- Add session management dashboard
- Consider 2FA for organizer accounts

---

## Version History

- **v0.2.0** (Unreleased) - Authentication & Authorization
- **v0.1.0** (2026-03-25) - Initial Release with Electric SQL sync

---

## Contributing

See the main README.md for contribution guidelines and development workflow.

## License

Private project - All rights reserved.
