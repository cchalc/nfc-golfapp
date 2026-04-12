// Only export client-safe functions and types
// utils.ts contains server-only code and should not be re-exported

// Client-callable server functions
export {
  requestMagicLink,
  verifyMagicLink,
  getSession,
  logout,
  type AuthSession,
} from './mutations'

export {
  getTripRole,
  requireOrganizer,
  requireTripAccess,
  canManageGolferScores,
  type TripRole,
  type TripAccess,
} from './authorization'

export {
  createTripInvite,
  acceptTripInvite,
  getInviteInfo,
  listTripInvites,
  deleteTripInvite,
  type TripInvite,
  type InviteInfo,
} from './invites'
