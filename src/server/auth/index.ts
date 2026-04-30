// Only export client-safe functions and types
// utils.ts contains server-only code and should not be re-exported

export {
	canManageGolferScores,
	getTripRole,
	requireOrganizer,
	requireTripAccess,
	type TripAccess,
	type TripRole,
} from "./authorization";
export {
	acceptTripInvite,
	createTripInvite,
	deleteTripInvite,
	getInviteInfo,
	type InviteInfo,
	listTripInvites,
	type TripInvite,
} from "./invites";
// Client-callable server functions
export {
	type AuthSession,
	getSession,
	logout,
	requestMagicLink,
	verifyMagicLink,
} from "./mutations";
