import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Team, TeamMember } from "../../db/collections";
import {
	deleteTeam,
	deleteTeamMember,
	insertTeam,
	insertTeamMember,
	updateTeam,
} from "../../server/mutations";
import {
	getTeamMembers,
	getTeamMembersByTripId,
	getTeams,
	getTeamsByTripId,
} from "../../server/queries";
import { tripKeys } from "./useTrips";

export const teamKeys = {
	all: ["teams"] as const,
	lists: () => [...teamKeys.all, "list"] as const,
	list: () => [...teamKeys.lists()] as const,
	byTrip: (tripId: string) => [...teamKeys.lists(), "trip", tripId] as const,
};

export const teamMemberKeys = {
	all: ["teamMembers"] as const,
	lists: () => [...teamMemberKeys.all, "list"] as const,
	list: () => [...teamMemberKeys.lists()] as const,
	byTrip: (tripId: string) =>
		[...teamMemberKeys.lists(), "trip", tripId] as const,
};

export function useTeams() {
	return useQuery({
		queryKey: teamKeys.list(),
		queryFn: () => getTeams(),
	});
}

export function useTeamsByTripId(tripId: string) {
	return useQuery({
		queryKey: teamKeys.byTrip(tripId),
		queryFn: () => getTeamsByTripId({ data: tripId }),
		enabled: !!tripId,
	});
}

export function useTeamMembers() {
	return useQuery({
		queryKey: teamMemberKeys.list(),
		queryFn: () => getTeamMembers(),
	});
}

export function useTeamMembersByTripId(tripId: string) {
	return useQuery({
		queryKey: teamMemberKeys.byTrip(tripId),
		queryFn: () => getTeamMembersByTripId({ data: tripId }),
		enabled: !!tripId,
	});
}

export function useCreateTeam() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (team: Team) => insertTeam({ data: team }),
		onSuccess: (_, team) => {
			queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
			queryClient.invalidateQueries({ queryKey: teamKeys.byTrip(team.tripId) });
			queryClient.invalidateQueries({ queryKey: tripKeys.detail(team.tripId) });
		},
	});
}

export function useUpdateTeam() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			changes,
		}: {
			id: string;
			changes: Partial<Omit<Team, "id">>;
			tripId: string;
		}) => updateTeam({ data: { id, changes } }),
		onSuccess: (_, { tripId }) => {
			queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
			queryClient.invalidateQueries({ queryKey: teamKeys.byTrip(tripId) });
		},
	});
}

export function useDeleteTeam() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id }: { id: string; tripId: string }) =>
			deleteTeam({ data: { id } }),
		onSuccess: (_, { tripId }) => {
			queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
			queryClient.invalidateQueries({ queryKey: teamKeys.byTrip(tripId) });
			queryClient.invalidateQueries({
				queryKey: teamMemberKeys.byTrip(tripId),
			});
		},
	});
}

export function useCreateTeamMember() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (teamMember: TeamMember) =>
			insertTeamMember({ data: teamMember }),
		onSuccess: (_, teamMember) => {
			queryClient.invalidateQueries({ queryKey: teamMemberKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: teamMemberKeys.byTrip(teamMember.tripId),
			});
		},
	});
}

export function useDeleteTeamMember() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id }: { id: string; tripId: string }) =>
			deleteTeamMember({ data: { id } }),
		onSuccess: (_, { tripId }) => {
			queryClient.invalidateQueries({ queryKey: teamMemberKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: teamMemberKeys.byTrip(tripId),
			});
		},
	});
}
