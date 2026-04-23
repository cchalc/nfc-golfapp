// src/components/scoring/HoleNavigator.tsx
import { Button, Flex, Text } from "@radix-ui/themes";
import { useEffect, useRef } from "react";

interface HoleNavigatorProps {
	currentHole: number;
	onHoleChange: (hole: number) => void;
	scores: (number | null)[];
	totalHoles?: number;
}

export function HoleNavigator({
	currentHole,
	onHoleChange,
	scores,
	totalHoles = 18,
}: HoleNavigatorProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Scroll current hole into view
		const container = scrollRef.current;
		if (!container) return;

		const button = container.children[currentHole - 1] as HTMLElement;
		if (button) {
			button.scrollIntoView({
				behavior: "smooth",
				inline: "center",
				block: "nearest",
			});
		}
	}, [currentHole]);

	return (
		<Flex
			ref={scrollRef}
			gap="1"
			py="2"
			style={{
				overflowX: "auto",
				scrollSnapType: "x mandatory",
				WebkitOverflowScrolling: "touch",
				scrollbarWidth: "none",
			}}
		>
			{Array.from({ length: totalHoles }, (_, i) => {
				const hole = i + 1;
				const isActive = hole === currentHole;
				const hasScore = scores[i] !== null && scores[i] !== undefined;

				return (
					<Button
						key={hole}
						variant={isActive ? "solid" : "soft"}
						color={isActive ? "grass" : hasScore ? "gray" : undefined}
						size="2"
						onClick={() => onHoleChange(hole)}
						style={{
							scrollSnapAlign: "center",
							minWidth: "40px",
							flexShrink: 0,
						}}
					>
						<Text size="2" weight={isActive ? "bold" : "regular"}>
							{hole}
						</Text>
					</Button>
				);
			})}
		</Flex>
	);
}
