// src/components/scoring/GolferSwitcher.tsx
import { Flex, IconButton, Text } from "@radix-ui/themes";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Golfer {
	id: string;
	name: string;
}

interface GolferSwitcherProps {
	golfers: Golfer[];
	currentIndex: number;
	onIndexChange: (index: number) => void;
}

export function GolferSwitcher({
	golfers,
	currentIndex,
	onIndexChange,
}: GolferSwitcherProps) {
	const currentGolfer = golfers[currentIndex];
	const canGoPrev = currentIndex > 0;
	const canGoNext = currentIndex < golfers.length - 1;

	return (
		<Flex
			align="center"
			justify="between"
			p="3"
			style={{
				background: "var(--gray-2)",
				borderRadius: "8px",
				border: "1px solid var(--gray-4)",
			}}
		>
			<IconButton
				variant="ghost"
				color="gray"
				disabled={!canGoPrev}
				onClick={() => onIndexChange(currentIndex - 1)}
			>
				<ChevronLeft size={20} />
			</IconButton>

			<Flex direction="column" align="center" gap="1">
				<Text weight="medium">{currentGolfer?.name}</Text>
				<Text size="1" color="gray">
					{currentIndex + 1} of {golfers.length}
				</Text>
			</Flex>

			<IconButton
				variant="ghost"
				color="gray"
				disabled={!canGoNext}
				onClick={() => onIndexChange(currentIndex + 1)}
			>
				<ChevronRight size={20} />
			</IconButton>
		</Flex>
	);
}
