import { createServerFn } from "@tanstack/react-start";
import type { Round } from "../../db/collections";
import { getDb, wrapMutation } from "./db";

export const insertRound = createServerFn({ method: "POST" })
	.inputValidator((data: Round) => data)
	.handler(async ({ data: round }): Promise<{ id: string }> => {
		return wrapMutation("insertRound", async () => {
			const sql = getDb();

			const result = await sql`
        INSERT INTO rounds (id, trip_id, course_id, round_date, round_number, notes, included_in_scoring)
        VALUES (
          ${round.id},
          ${round.tripId},
          ${round.courseId},
          ${round.roundDate},
          ${round.roundNumber},
          ${round.notes},
          ${round.includedInScoring}
        )
        RETURNING id
      `;

			return { id: result[0].id as string };
		});
	});

export const updateRound = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: string;
			changes: Partial<Omit<Round, "id" | "tripId" | "courseId">>;
		}) => data,
	)
	.handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
		return wrapMutation("updateRound", async () => {
			const sql = getDb();

			await sql`
        UPDATE rounds
        SET round_date = COALESCE(${changes.roundDate ?? null}, round_date),
            round_number = COALESCE(${changes.roundNumber ?? null}, round_number),
            notes = COALESCE(${changes.notes ?? null}, notes),
            included_in_scoring = COALESCE(${changes.includedInScoring ?? null}, included_in_scoring)
        WHERE id = ${id}
      `;

			return { id };
		});
	});

export const deleteRound = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data: { id } }): Promise<{ id: string }> => {
		return wrapMutation("deleteRound", async () => {
			const sql = getDb();

			await sql`DELETE FROM rounds WHERE id = ${id}`;

			return { id };
		});
	});

export const reorderRounds = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { tripId: string; roundIds: string[] }) => data,
	)
	.handler(async ({ data: { tripId, roundIds } }): Promise<{ success: boolean }> => {
		return wrapMutation("reorderRounds", async () => {
			const sql = getDb();

			// Update each round's roundNumber based on its position in the array
			for (let i = 0; i < roundIds.length; i++) {
				await sql`
					UPDATE rounds
					SET round_number = ${i + 1}
					WHERE id = ${roundIds[i]} AND trip_id = ${tripId}
				`;
			}

			return { success: true };
		});
	});
