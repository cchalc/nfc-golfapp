import { Button, Card, Flex, Text } from "@radix-ui/themes";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
	const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
		null,
	);
	const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker
				.register("/sw.js")
				.then((registration) => {
					registration.addEventListener("updatefound", () => {
						const newWorker = registration.installing;
						if (newWorker) {
							newWorker.addEventListener("statechange", () => {
								if (
									newWorker.state === "installed" &&
									navigator.serviceWorker.controller
								) {
									setWaitingWorker(newWorker);
									setShowUpdatePrompt(true);
								}
							});
						}
					});
				})
				.catch((err) => {
					console.error("Service worker registration failed:", err);
				});

			// Handle controller change (when skipWaiting is called)
			navigator.serviceWorker.addEventListener("controllerchange", () => {
				window.location.reload();
			});
		}
	}, []);

	const handleUpdate = () => {
		if (waitingWorker) {
			waitingWorker.postMessage({ type: "SKIP_WAITING" });
		}
	};

	const handleDismiss = () => {
		setShowUpdatePrompt(false);
	};

	if (!showUpdatePrompt) {
		return null;
	}

	return (
		<Card
			style={{
				position: "fixed",
				bottom: "16px",
				left: "16px",
				right: "16px",
				zIndex: 1000,
				maxWidth: "400px",
				margin: "0 auto",
			}}
		>
			<Flex direction="column" gap="3">
				<Text size="2">A new version is available.</Text>
				<Flex gap="2">
					<Button size="2" onClick={handleUpdate}>
						<RefreshCw size={14} />
						Update now
					</Button>
					<Button size="2" variant="soft" onClick={handleDismiss}>
						Later
					</Button>
				</Flex>
			</Flex>
		</Card>
	);
}
