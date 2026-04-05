import { Button, Flex } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { Plus, Trophy, Users } from "lucide-react";

interface QuickActionsProps {
	tripId: string;
	canManage: boolean;
}

/**
 * Quick action buttons for trip dashboard
 */
export function QuickActions({ tripId, canManage }: QuickActionsProps) {
	return (
		<Flex gap="2" wrap="wrap">
			{canManage && (
				<Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
					<Button variant="solid" size="2">
						<Plus size={16} />
						Add Round
					</Button>
				</Link>
			)}
			{canManage && (
				<Link to="/trips/$tripId/golfers" params={{ tripId }}>
					<Button variant="soft" size="2">
						<Users size={16} />
						Add Golfer
					</Button>
				</Link>
			)}
			<Link to="/trips/$tripId/leaderboards" params={{ tripId }}>
				<Button variant="soft" size="2">
					<Trophy size={16} />
					Leaderboard
				</Button>
			</Link>
		</Flex>
	);
}
