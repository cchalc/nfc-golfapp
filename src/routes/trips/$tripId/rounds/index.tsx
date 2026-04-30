import {
	Badge,
	Button,
	Card,
	Container,
	Flex,
	Heading,
	IconButton,
	Text,
} from "@radix-ui/themes";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronRight, ChevronUp, GripVertical, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { RoundDeleteButton } from "../../../../components/rounds/RoundDeleteButton";
import { EmptyState } from "../../../../components/ui/EmptyState";
import {
	useCourses,
	useReorderRounds,
	useRoundsByTripId,
	useTrip,
} from "../../../../hooks/queries";
import { useTripRole } from "../../../../hooks/useTripRole";

export const Route = createFileRoute("/trips/$tripId/rounds/")({
	ssr: false,
	component: RoundsPage,
});

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "short",
		day: "numeric",
	});
}

function RoundsPage() {
	const { tripId } = Route.useParams();
	const { canManage } = useTripRole(tripId);
	const [isEditMode, setIsEditMode] = useState(false);

	const { data: trip } = useTrip(tripId);
	const { data: rounds } = useRoundsByTripId(tripId);
	const { data: courses } = useCourses();
	const reorderRounds = useReorderRounds();

	const courseMap = new Map((courses || []).map((c) => [c.id, c]));

	function moveRound(index: number, direction: "up" | "down") {
		if (!rounds) return;
		const newIndex = direction === "up" ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= rounds.length) return;

		const newOrder = [...rounds];
		[newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
		reorderRounds.mutate({
			tripId,
			roundIds: newOrder.map((r) => r.id),
		});
	}

	if (!trip) {
		return (
			<Container size="2" py="6">
				<Text>Trip not found</Text>
			</Container>
		);
	}

	return (
		<Container size="2" py="6">
			<Flex direction="column" gap="5">
				<Link to="/trips/$tripId" params={{ tripId }}>
					<Button variant="ghost" size="1">
						<ArrowLeft size={16} />
						Back to Trip
					</Button>
				</Link>
				<Flex justify="between" align="center">
					<Flex direction="column" gap="3">
						<Heading size="7">Rounds</Heading>
						<Text color="gray">{trip.name}</Text>
					</Flex>
					<Flex gap="2">
						{rounds && rounds.length > 1 && (
							<Button
								variant={isEditMode ? "solid" : "soft"}
								color={isEditMode ? "amber" : "gray"}
								onClick={() => setIsEditMode(!isEditMode)}
							>
								{isEditMode ? (
									<>
										<X size={16} />
										Done
									</>
								) : (
									<>
										<Pencil size={16} />
										Reorder
									</>
								)}
							</Button>
						)}
						{canManage && (
							<Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
								<Button>
									<Plus size={16} />
									Add Course
								</Button>
							</Link>
						)}
					</Flex>
				</Flex>

				{rounds && rounds.length > 0 ? (
					<Flex direction="column" gap="2">
						{rounds.map((round, index) => {
							const course = courseMap.get(round.courseId);
							return (
								<Card key={round.id}>
									<Flex justify="between" align="center">
										{isEditMode && (
											<Flex align="center" gap="2" pr="3">
												<GripVertical size={16} style={{ color: "var(--gray-8)" }} />
												<Flex direction="column" gap="1">
													<IconButton
														size="1"
														variant="soft"
														disabled={index === 0 || reorderRounds.isPending}
														onClick={() => moveRound(index, "up")}
													>
														<ChevronUp size={14} />
													</IconButton>
													<IconButton
														size="1"
														variant="soft"
														disabled={index === rounds.length - 1 || reorderRounds.isPending}
														onClick={() => moveRound(index, "down")}
													>
														<ChevronDown size={14} />
													</IconButton>
												</Flex>
											</Flex>
										)}
										<Link
											to="/trips/$tripId/rounds/$roundId"
											params={{ tripId, roundId: round.id }}
											style={{ flex: 1, textDecoration: "none" }}
										>
											<Flex direction="column" gap="3">
												<Flex align="center" gap="2">
													<Badge>Round {round.roundNumber}</Badge>
													<Text weight="medium">
														{course?.name || "Unknown Course"}
													</Text>
												</Flex>
												<Text size="2" color="gray">
													{formatDate(round.roundDate)}
												</Text>
												{round.notes && (
													<Text size="2" color="gray">
														{round.notes}
													</Text>
												)}
											</Flex>
										</Link>
										<Flex align="center" gap="2">
											<Link
												to="/trips/$tripId/rounds/$roundId"
												params={{ tripId, roundId: round.id }}
											>
												<ChevronRight
													size={16}
													style={{ color: "var(--gray-9)" }}
												/>
											</Link>
											{canManage && (
												<RoundDeleteButton
													round={round}
													courseName={course?.name || "Unknown Course"}
													tripId={tripId}
												/>
											)}
										</Flex>
									</Flex>
								</Card>
							);
						})}
					</Flex>
				) : (
					<EmptyState
						action={
							canManage ? (
								<Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
									<Button>
										<Plus size={16} />
										Add Course
									</Button>
								</Link>
							) : undefined
						}
					/>
				)}
			</Flex>
		</Container>
	);
}
