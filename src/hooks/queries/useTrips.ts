import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Trip } from "../../db/collections";
import { deleteTrip, insertTrip, updateTrip } from "../../server/mutations";
import { getTrip, getTrips } from "../../server/queries";

export const tripKeys = {
	all: ["trips"] as const,
	lists: () => [...tripKeys.all, "list"] as const,
	list: () => [...tripKeys.lists()] as const,
	details: () => [...tripKeys.all, "detail"] as const,
	detail: (id: string) => [...tripKeys.details(), id] as const,
};

export function useTrips() {
	return useQuery({
		queryKey: tripKeys.list(),
		queryFn: () => getTrips(),
	});
}

export function useTrip(id: string) {
	return useQuery({
		queryKey: tripKeys.detail(id),
		queryFn: () => getTrip({ data: id }),
		enabled: !!id,
	});
}

export function useCreateTrip() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (trip: Omit<Trip, "createdAt"> & { createdAt?: Date }) =>
			insertTrip({ data: trip }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
		},
	});
}

export function useUpdateTrip() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			changes,
		}: {
			id: string;
			changes: Partial<Omit<Trip, "id" | "createdAt" | "createdBy">>;
		}) => updateTrip({ data: { id, changes } }),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
		},
	});
}

export function useDeleteTrip() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteTrip({ data: { id } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
		},
	});
}
