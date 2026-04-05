/**
 * Trip Data Context
 *
 * Provides trip-scoped Electric SQL collections with sync status tracking.
 *
 * Features:
 * - Priority-tiered loading (critical → high → normal)
 * - Sync status per tier for granular loading states
 * - Collections persist across trip subpage navigation
 * - Clean lifecycle management
 *
 * Usage:
 * ```tsx
 * const { collections, isReady, status } = useTripData()
 * if (!isReady('critical')) return <DashboardSkeleton />
 * ```
 */

import { useLiveQuery } from "@tanstack/react-db";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	createTripCollections,
	type PriorityTier,
	type TripCollections,
} from "../db/trip-collections";

type TierStatus = "loading" | "ready" | "error";

interface SyncStatus {
	critical: TierStatus;
	high: TierStatus;
	normal: TierStatus;
}

interface TripDataContextValue {
	tripId: string;
	collections: TripCollections;
	status: SyncStatus;
	isReady: (tier: PriorityTier) => boolean;
	isLoading: boolean;
	error: Error | null;
}

const TripDataContext = createContext<TripDataContextValue | null>(null);

interface TripDataProviderProps {
	tripId: string;
	children: ReactNode;
}

/**
 * Provider for trip-scoped collections with sync status
 */
export function TripDataProvider({ tripId, children }: TripDataProviderProps) {
	const [error, setError] = useState<Error | null>(null);

	// Create trip-scoped collections (memoized by tripId)
	const collections = useMemo(() => {
		try {
			return createTripCollections(tripId);
		} catch (e) {
			setError(
				e instanceof Error ? e : new Error("Failed to create collections"),
			);
			return null;
		}
	}, [tripId]);

	// Track sync status by querying each collection
	// We just need to know if data has arrived, so select one row with orderBy for determinism
	// Critical tier: tripGolfers, rounds, roundSummaries
	const { data: tripGolfersData } = useLiveQuery(
		(q) =>
			collections
				? q
						.from({ tg: collections.tripGolfers })
						.select(({ tg }) => ({ id: tg.id }))
						.orderBy(({ tg }) => tg.id)
						.limit(1)
				: null,
		[tripId, collections],
	);
	const { data: roundsData } = useLiveQuery(
		(q) =>
			collections
				? q
						.from({ r: collections.rounds })
						.select(({ r }) => ({ id: r.id }))
						.orderBy(({ r }) => r.id)
						.limit(1)
				: null,
		[tripId, collections],
	);
	const { data: summariesData } = useLiveQuery(
		(q) =>
			collections
				? q
						.from({ s: collections.roundSummaries })
						.select(({ s }) => ({ id: s.id }))
						.orderBy(({ s }) => s.id)
						.limit(1)
				: null,
		[tripId, collections],
	);

	// High tier: golfers, teams, teamMembers, challenges, challengeResults
	const { data: golfersData } = useLiveQuery(
		(q) =>
			collections
				? q
						.from({ g: collections.golfers })
						.select(({ g }) => ({ id: g.id }))
						.orderBy(({ g }) => g.id)
						.limit(1)
				: null,
		[tripId, collections],
	);
	const { data: teamsData } = useLiveQuery(
		(q) =>
			collections
				? q
						.from({ t: collections.teams })
						.select(({ t }) => ({ id: t.id }))
						.orderBy(({ t }) => t.id)
						.limit(1)
				: null,
		[tripId, collections],
	);

	// Normal tier: scores (large dataset)
	const { data: scoresData } = useLiveQuery(
		(q) =>
			collections
				? q
						.from({ s: collections.scores })
						.select(({ s }) => ({ id: s.id }))
						.orderBy(({ s }) => s.id)
						.limit(1)
				: null,
		[tripId, collections],
	);

	// Determine tier status based on whether queries have returned
	// Note: Empty arrays mean "synced but no data" which is still ready
	const status: SyncStatus = useMemo(
		() => ({
			critical:
				tripGolfersData !== undefined &&
				roundsData !== undefined &&
				summariesData !== undefined
					? "ready"
					: "loading",
			high:
				golfersData !== undefined && teamsData !== undefined
					? "ready"
					: "loading",
			normal: scoresData !== undefined ? "ready" : "loading",
		}),
		[
			tripGolfersData,
			roundsData,
			summariesData,
			golfersData,
			teamsData,
			scoresData,
		],
	);

	const isReady = useCallback(
		(tier: PriorityTier): boolean => {
			if (tier === "critical") return status.critical === "ready";
			if (tier === "high")
				return status.critical === "ready" && status.high === "ready";
			return (
				status.critical === "ready" &&
				status.high === "ready" &&
				status.normal === "ready"
			);
		},
		[status],
	);

	const isLoading = status.critical === "loading";

	// Cleanup collections when unmounting or tripId changes
	useEffect(() => {
		return () => {
			collections?.cleanup();
		};
	}, [collections]);

	if (!collections) {
		return null; // Or error boundary
	}

	return (
		<TripDataContext.Provider
			value={{
				tripId,
				collections,
				status,
				isReady,
				isLoading,
				error,
			}}
		>
			{children}
		</TripDataContext.Provider>
	);
}

/**
 * Hook to access trip data context
 */
export function useTripData(): TripDataContextValue {
	const context = useContext(TripDataContext);
	if (!context) {
		throw new Error("useTripData must be used within TripDataProvider");
	}
	return context;
}

/**
 * Hook to check if a specific tier is ready
 */
export function useTripDataReady(tier: PriorityTier): boolean {
	const { isReady } = useTripData();
	return isReady(tier);
}
