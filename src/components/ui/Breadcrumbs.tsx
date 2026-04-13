import { Flex, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
	label: string;
	to?: string;
	params?: Record<string, string>;
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[];
}

/**
 * Navigation breadcrumbs for deep pages
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
	return (
		<Flex align="center" gap="1" wrap="wrap">
			{items.map((item, index) => (
				<Flex key={item.label} align="center" gap="1">
					{index > 0 && <ChevronRight size={14} color="var(--gray-8)" />}
					{item.to ? (
						<Link to={item.to} params={item.params}>
							<Text size="2" color="blue" style={{ cursor: "pointer" }}>
								{item.label}
							</Text>
						</Link>
					) : (
						<Text size="2" color="gray">
							{item.label}
						</Text>
					)}
				</Flex>
			))}
		</Flex>
	);
}
