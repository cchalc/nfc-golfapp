import { Button, Container, Flex, Heading } from "@radix-ui/themes";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { TripCard } from "../../components/trips/TripCard";
import { AnimatedList } from "../../components/ui/AnimatedList";
import { EmptyState } from "../../components/ui/EmptyState";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { useTripGolferCounts, useTrips } from "../../hooks/queries";
import { useRequireAuth } from "../../hooks/useRequireAuth";

export const Route = createFileRoute("/trips/")({
	ssr: false,
	component: TripsPage,
});

function TripsPage() {
	useRequireAuth();

	const { data: trips, isLoading } = useTrips();
	const { data: tripGolferCounts } = useTripGolferCounts();

	const golferCountByTrip = new Map(
		(tripGolferCounts || []).map((tg) => [tg.tripId, tg.count]),
	);

	if (isLoading) {
		return (
			<Container size="2" py="6">
				<Flex direction="column" gap="4">
					<Heading size="7">Trips</Heading>
					<Flex direction="column" gap="3">
						<CardSkeleton />
						<CardSkeleton />
						<CardSkeleton />
					</Flex>
				</Flex>
			</Container>
		);
	}

	return (
		<Container size="2" py="6">
			<Flex direction="column" gap="4">
				<Flex justify="between" align="center">
					<Heading size="7">Trips</Heading>
					<Link to="/trips/new">
						<Button color="grass">
							<Plus size={16} />
							New Trip
						</Button>
					</Link>
				</Flex>

				{trips && trips.length > 0 ? (
					<Flex direction="column" gap="3">
						<AnimatedList>
							{trips.map((trip) => (
								<TripCard
									key={trip.id}
									trip={trip}
									golferCount={golferCountByTrip.get(trip.id) || 0}
								/>
							))}
						</AnimatedList>
					</Flex>
				) : (
					<EmptyState
						action={
							<Link to="/trips/new">
								<Button color="grass">
									<Plus size={16} />
									Create Trip
								</Button>
							</Link>
						}
					/>
				)}
			</Flex>
		</Container>
	);
}
