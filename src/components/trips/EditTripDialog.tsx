import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import { Pencil } from "lucide-react";
import { useState } from "react";
import type { Trip } from "../../db/collections";
import { useUpdateTrip } from "../../hooks/queries/useTrips";
import { useToast } from "../../hooks/useToast";

interface EditTripDialogProps {
	trip: Trip;
}

export function EditTripDialog({ trip }: EditTripDialogProps) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(trip.name);
	const [location, setLocation] = useState(trip.location);
	const updateTrip = useUpdateTrip();
	const { showToast } = useToast();

	const handleSave = async () => {
		if (!name.trim()) return;

		try {
			await updateTrip.mutateAsync({
				id: trip.id,
				changes: { name: name.trim(), location: location.trim() },
			});
			showToast("Trip updated", "success");
			setOpen(false);
		} catch {
			showToast("Failed to update trip", "error");
		}
	};

	// Reset form when dialog opens
	const handleOpenChange = (isOpen: boolean) => {
		if (isOpen) {
			setName(trip.name);
			setLocation(trip.location);
		}
		setOpen(isOpen);
	};

	return (
		<Dialog.Root open={open} onOpenChange={handleOpenChange}>
			<Dialog.Trigger>
				<Button variant="soft" color="gray" size="1">
					<Pencil size={14} />
					Edit
				</Button>
			</Dialog.Trigger>
			<Dialog.Content maxWidth="400px">
				<Dialog.Title>Edit Trip</Dialog.Title>
				<Flex direction="column" gap="4" mt="4">
					<Flex direction="column" gap="2">
						<Text as="label" size="2" weight="medium">
							Name
						</Text>
						<TextField.Root
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Trip name"
						/>
					</Flex>
					<Flex direction="column" gap="2">
						<Text as="label" size="2" weight="medium">
							Location
						</Text>
						<TextField.Root
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							placeholder="Location (optional)"
						/>
					</Flex>
					<Flex gap="3" justify="end" mt="2">
						<Dialog.Close>
							<Button variant="soft" color="gray">
								Cancel
							</Button>
						</Dialog.Close>
						<Button
							color="grass"
							onClick={handleSave}
							disabled={!name.trim() || updateTrip.isPending}
						>
							{updateTrip.isPending ? "Saving..." : "Save"}
						</Button>
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}
