// src/components/ui/Toast.tsx
import { Flex, IconButton, Text } from "@radix-ui/themes";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import {
	type ToastData,
	useToastContext,
} from "../../contexts/ToastContext";

function ToastItem({
	toast,
	onDismiss,
}: { toast: ToastData; onDismiss: () => void }) {
	const Icon = toast.type === "success" ? CheckCircle : AlertCircle;
	const color = toast.type === "success" ? "var(--grass-9)" : "var(--red-9)";

	return (
		<Flex
			align="center"
			gap="2"
			p="3"
			style={{
				background: "var(--gray-2)",
				border: "1px solid var(--gray-4)",
				borderRadius: "8px",
				boxShadow: "var(--card-shadow-hover)",
				animation: "toastSlide var(--duration-slow) ease-out",
			}}
		>
			<Icon size={18} style={{ color, flexShrink: 0 }} />
			<Text size="2" style={{ flex: 1 }}>
				{toast.message}
			</Text>
			<IconButton size="1" variant="ghost" color="gray" onClick={onDismiss}>
				<X size={14} />
			</IconButton>
		</Flex>
	);
}

export function ToastContainer() {
	const { toasts, dismissToast } = useToastContext();

	if (toasts.length === 0) return null;

	return (
		<div
			style={{
				position: "fixed",
				top: "16px",
				right: "16px",
				zIndex: 9999,
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				maxWidth: "360px",
				width: "100%",
			}}
		>
			{toasts.map((toast) => (
				<ToastItem
					key={toast.id}
					toast={toast}
					onDismiss={() => dismissToast(toast.id)}
				/>
			))}
		</div>
	);
}
