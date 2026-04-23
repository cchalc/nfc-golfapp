import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

export interface ToastData {
	id: string;
	message: string;
	type: "success" | "error";
	duration: number;
}

interface ToastContextValue {
	toasts: ToastData[];
	showToast: (
		message: string,
		type: "success" | "error",
		duration?: number,
	) => void;
	dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastData[]>([]);

	const showToast = useCallback(
		(message: string, type: "success" | "error", duration = 3000) => {
			const id = crypto.randomUUID();
			setToasts((prev) => [...prev, { id, message, type, duration }]);

			setTimeout(() => {
				setToasts((prev) => prev.filter((t) => t.id !== id));
			}, duration);
		},
		[],
	);

	const dismissToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
			{children}
		</ToastContext.Provider>
	);
}

export function useToastContext() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToastContext must be used within ToastProvider");
	}
	return context;
}
