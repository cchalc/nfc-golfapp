import { useState } from "react";

/** Dialog open/close state. Returns [isOpen, setOpen], same shape as useState. */
export function useDialogState() {
	return useState(false);
}
