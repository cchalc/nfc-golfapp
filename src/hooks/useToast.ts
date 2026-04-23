import { useToastContext } from "../contexts/ToastContext";

export function useToast() {
	const { showToast } = useToastContext();
	return { showToast };
}
