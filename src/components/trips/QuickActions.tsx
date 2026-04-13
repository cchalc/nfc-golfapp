import { Button, Grid } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { Flag, Plus, Target, Trophy, Users } from "lucide-react";

interface QuickActionsProps {
	tripId: string;
	canManage: boolean;
}

/**
 * Quick action buttons for trip dashboard
 */
export function QuickActions({ tripId, canManage }: QuickActionsProps) {
	return (
		<Grid columns={{ initial: "2", sm: "3" }} gap="2">
			{canManage && (
				<Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
					<Button variant="solid" size="3" style={{ width: "100%" }}>
						<Plus size={18} />
						Add Round
					</Button>
				</Link>
			)}
			<Link to="/trips/$tripId/golfers" params={{ tripId }}>
				<Button variant="soft" size="3" style={{ width: "100%" }}>
					<Users size={18} />
					Golfers
				</Button>
			</Link>
			<Link to="/trips/$tripId/leaderboards" params={{ tripId }}>
				<Button variant="soft" size="3" style={{ width: "100%" }}>
					<Trophy size={18} />
					Leaderboard
				</Button>
			</Link>
			<Link to="/trips/$tripId/teams" params={{ tripId }}>
				<Button variant="soft" size="3" style={{ width: "100%" }}>
					<Flag size={18} />
					Teams
				</Button>
			</Link>
			<Link to="/trips/$tripId/challenges" params={{ tripId }}>
				<Button variant="soft" size="3" style={{ width: "100%" }}>
					<Target size={18} />
					Challenges
				</Button>
			</Link>
		</Grid>
	);
}
