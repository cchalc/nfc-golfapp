import { Flex } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface EmptyStateProps {
	action: ReactNode;
}

export function EmptyState({ action }: EmptyStateProps) {
	return (
		<Flex direction="column" align="center" py="9">
			{action}
		</Flex>
	);
}
