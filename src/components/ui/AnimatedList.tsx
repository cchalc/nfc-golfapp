import { Children, type CSSProperties, type ReactNode } from "react";

interface AnimatedListProps {
	children: ReactNode;
	staggerMs?: number;
	className?: string;
}

export function AnimatedList({
	children,
	staggerMs = 50,
	className,
}: AnimatedListProps) {
	return (
		<>
			{Children.map(children, (child, index) => (
				<div
					className={`stagger-item ${className || ""}`}
					style={
						{
							"--stagger-index": index,
							"--stagger-ms": `${staggerMs}ms`,
						} as CSSProperties
					}
				>
					{child}
				</div>
			))}
		</>
	);
}
