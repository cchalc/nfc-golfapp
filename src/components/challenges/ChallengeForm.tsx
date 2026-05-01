import {
	Badge,
	Button,
	Checkbox,
	Flex,
	Select,
	Text,
	TextArea,
	TextField,
} from "@radix-ui/themes";
import { useMemo, useState } from "react";
import type { Challenge } from "../../db/collections";
import {
	useCourses,
	useCreateChallenge,
	useHolesByCourseId,
	useRoundsByTripId,
	useUpdateChallenge,
} from "../../hooks/queries";
import { getChallengeTypeLabel, getDefaultScope } from "../../lib/challenges";
import { challengeFormSchema, validateForm } from "../../lib/validation";
import { FormField } from "../ui/FormField";

type ChallengeType = Challenge["challengeType"];

const CHALLENGE_TYPES: ChallengeType[] = [
	"closest_to_pin",
	"longest_drive",
	"most_birdies",
	"custom",
];

interface ChallengeFormProps {
	tripId: string;
	challengeId?: string;
	initialData?: Partial<Challenge>;
	onSuccess?: () => void;
}

export function ChallengeForm({
	tripId,
	challengeId,
	initialData,
	onSuccess,
}: ChallengeFormProps) {
	const [errors, setErrors] = useState<Map<string, string>>(new Map());
	// Initialize selectedRoundIds from initialData.roundIds or fallback to roundId
	const [selectedRoundIds, setSelectedRoundIds] = useState<string[]>(
		initialData?.roundIds?.length
			? initialData.roundIds
			: initialData?.roundId
				? [initialData.roundId]
				: [],
	);

	// Fetch rounds for this trip
	const { data: rounds } = useRoundsByTripId(tripId);

	// Fetch courses to show names in round selector
	const { data: courses } = useCourses();
	const courseMap = useMemo(
		() => new Map((courses || []).map((c) => [c.id, c])),
		[courses],
	);

	// Mutations
	const createChallenge = useCreateChallenge();
	const updateChallenge = useUpdateChallenge();

	function handleTypeChange(value: string, form: HTMLFormElement) {
		const type = value as ChallengeType;
		const defaultScope = getDefaultScope(type);

		// Update scope select
		const scopeHidden = form.querySelector(
			'[name="scope"]',
		) as HTMLInputElement;
		if (scopeHidden) {
			scopeHidden.value = defaultScope;
		}

		// Show/hide round and hole selectors based on scope
		const roundSection = form.querySelector(
			'[data-field="round"]',
		) as HTMLElement;
		const holeSection = form.querySelector(
			'[data-field="hole"]',
		) as HTMLElement;

		if (roundSection) {
			roundSection.style.display = defaultScope === "trip" ? "none" : "flex";
		}
		if (holeSection) {
			holeSection.style.display = defaultScope === "hole" ? "flex" : "none";
		}
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const name = (formData.get("name") as string).trim();
		const description = (formData.get("description") as string).trim();
		const challengeType = formData.get("challengeType") as ChallengeType;
		const scope = formData.get("scope") as "hole" | "round" | "trip";
		const holeId = formData.get("holeId") as string;
		const prizeDescription = (
			formData.get("prizeDescription") as string
		).trim();

		// Use selected rounds from state (multi-select)
		const roundIds = scope !== "trip" ? selectedRoundIds : [];
		// For backwards compatibility, also set roundId to first selected round
		const roundId = roundIds.length > 0 ? roundIds[0] : null;

		const validationData = {
			name,
			challengeType,
			scope,
			roundId,
			holeId: scope === "hole" && holeId ? holeId : null,
			prizeDescription,
		};

		// Clear old errors
		setErrors(new Map());

		// Validate
		const result = validateForm(challengeFormSchema, validationData);

		if (!result.success) {
			const newErrors = new Map<string, string>();
			Object.entries(result.errors).forEach(([field, message]) => {
				newErrors.set(field, message);
			});
			setErrors(newErrors);
			return;
		}

		const data = {
			tripId,
			name: result.data.name || "",
			description: description || "",
			challengeType: result.data.challengeType,
			scope: result.data.scope,
			roundId: result.data.roundId,
			roundIds,
			holeId: result.data.holeId,
			prizeDescription: result.data.prizeDescription,
		};

		if (challengeId) {
			// Update existing
			updateChallenge.mutate(
				{ id: challengeId, changes: data, tripId },
				{ onSuccess },
			);
		} else {
			// Insert new
			const newChallenge: Challenge = {
				id: crypto.randomUUID(),
				...data,
			};
			createChallenge.mutate(newChallenge, { onSuccess });
		}
	}

	const defaultType = initialData?.challengeType || "closest_to_pin";
	const defaultScope = initialData?.scope || getDefaultScope(defaultType);
	const showRoundSelector = defaultScope !== "trip";
	const showHoleSelector = defaultScope === "hole";

	const isPending = createChallenge.isPending || updateChallenge.isPending;

	return (
		<form onSubmit={handleSubmit} data-testid="challenge-form">
			<Flex direction="column" gap="4">
				<FormField
					label="Challenge Name (optional)"
					name="name"
					error={errors.get("name")}
				>
					<TextField.Root
						name="name"
						placeholder="Leave blank to use type as name"
						defaultValue={initialData?.name || ""}
						data-testid="challenge-name-input"
					/>
				</FormField>

				<Flex direction="column" gap="1">
					<Text as="label" size="2" weight="medium">
						Type
					</Text>
					<Select.Root
						name="challengeType"
						defaultValue={defaultType}
						onValueChange={(value) => {
							const form = document.querySelector("form") as HTMLFormElement;
							if (form) handleTypeChange(value, form);
						}}
					>
						<Select.Trigger />
						<Select.Content>
							{CHALLENGE_TYPES.map((type) => (
								<Select.Item key={type} value={type}>
									{getChallengeTypeLabel(type)}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Flex>

				<input type="hidden" name="scope" defaultValue={defaultScope} />

				<Flex
					direction="column"
					gap="2"
					data-field="round"
					style={{ display: showRoundSelector ? "flex" : "none" }}
				>
					<Text as="label" size="2" weight="medium">
						Rounds
					</Text>
					<Flex direction="column" gap="2">
						{(rounds || []).map((round) => {
							const course = courseMap.get(round.courseId);
							const dateStr = round.roundDate
								? new Date(round.roundDate).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									})
								: "";
							const isSelected = selectedRoundIds.includes(round.id);
							return (
								<label
									key={round.id}
									style={{ display: "flex", alignItems: "center", gap: "8px" }}
								>
									<Checkbox
										checked={isSelected}
										onCheckedChange={(checked) => {
											if (checked) {
												setSelectedRoundIds([...selectedRoundIds, round.id]);
											} else {
												setSelectedRoundIds(
													selectedRoundIds.filter((id) => id !== round.id),
												);
											}
										}}
									/>
									<Flex align="center" gap="2">
										<Badge size="1" color="gray">
											R{round.roundNumber}
										</Badge>
										<Text size="2">
											{course?.name || "Unknown"}{" "}
											{dateStr && (
												<Text size="1" color="gray">
													({dateStr})
												</Text>
											)}
										</Text>
									</Flex>
								</label>
							);
						})}
					</Flex>
					{selectedRoundIds.length === 0 && (
						<Text size="1" color="amber">
							Select at least one round
						</Text>
					)}
				</Flex>

				<HoleSelectorField
					defaultRoundId={initialData?.roundId || (rounds?.[0]?.id ?? "")}
					defaultHoleId={initialData?.holeId || ""}
					showInitially={showHoleSelector}
					rounds={rounds || []}
				/>

				<Flex direction="column" gap="1">
					<Text as="label" size="2" weight="medium">
						Description (optional)
					</Text>
					<TextArea
						name="description"
						placeholder="Details about this challenge..."
						defaultValue={initialData?.description || ""}
					/>
				</Flex>

				<Flex direction="column" gap="1">
					<Text as="label" size="2" weight="medium">
						Prize (optional)
					</Text>
					<TextField.Root
						name="prizeDescription"
						placeholder="$20 pot"
						defaultValue={initialData?.prizeDescription || ""}
					/>
				</Flex>

				<Button
					type="submit"
					disabled={isPending}
					data-testid="challenge-submit-btn"
				>
					{isPending
						? "Saving..."
						: challengeId
							? "Save Changes"
							: "Create Challenge"}
				</Button>
			</Flex>
		</form>
	);
}

interface HoleSelectorFieldProps {
	defaultRoundId: string;
	defaultHoleId: string;
	showInitially: boolean;
	rounds: Array<{ id: string; courseId: string }>;
}

function HoleSelectorField({
	defaultRoundId,
	defaultHoleId,
	showInitially,
	rounds,
}: HoleSelectorFieldProps) {
	// Get the round to find its courseId
	const round = rounds.find((r) => r.id === defaultRoundId);

	// Get all holes for the course
	const { data: holes } = useHolesByCourseId(round?.courseId || "");

	return (
		<Flex
			direction="column"
			gap="1"
			data-field="hole"
			style={{ display: showInitially ? "flex" : "none" }}
		>
			<Text as="label" size="2" weight="medium">
				Hole
			</Text>
			<Select.Root name="holeId" defaultValue={defaultHoleId}>
				<Select.Trigger placeholder="Select hole" />
				<Select.Content>
					{(holes || []).map((hole) => (
						<Select.Item key={hole.id} value={hole.id}>
							Hole {hole.holeNumber} (Par {hole.par})
						</Select.Item>
					))}
				</Select.Content>
			</Select.Root>
		</Flex>
	);
}
