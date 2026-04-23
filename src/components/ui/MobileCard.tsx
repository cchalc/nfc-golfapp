// src/components/ui/MobileCard.tsx
import { Card, Flex, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface MobileCardProps {
	rank: number;
	name: string;
	score: string;
	subtitle?: string;
	highlight?: boolean;
	onClick?: () => void;
	leftSlot?: ReactNode;
}

function getRankEmoji(rank: number): string {
	if (rank === 1) return "🥇";
	if (rank === 2) return "🥈";
	if (rank === 3) return "🥉";
	return "";
}

export function MobileCard({
	rank,
	name,
	score,
	subtitle,
	highlight = false,
	onClick,
	leftSlot,
}: MobileCardProps) {
	const emoji = getRankEmoji(rank);

	return (
		<Card
			className="hover-lift"
			style={{
				cursor: onClick ? "pointer" : undefined,
				background: highlight ? "var(--grass-2)" : undefined,
				borderColor: highlight ? "var(--grass-6)" : undefined,
			}}
			onClick={onClick}
		>
			<Flex align="center" gap="3" p="1">
				<Flex align="center" gap="2" style={{ minWidth: "48px" }}>
					{emoji && <Text size="4">{emoji}</Text>}
					{leftSlot}
					<Text weight="bold" color={rank > 3 ? "gray" : undefined}>
						{rank}
					</Text>
				</Flex>

				<Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
					<Text weight="medium" truncate>
						{name}
					</Text>
					{subtitle && (
						<Text size="1" color="gray">
							{subtitle}
						</Text>
					)}
				</Flex>

				<Text
					weight="bold"
					size="4"
					color={highlight ? "amber" : undefined}
					style={{ flexShrink: 0 }}
				>
					{score}
				</Text>
			</Flex>
		</Card>
	);
}
