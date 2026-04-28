import { defineEventHandler, getQuery, getRouterParam } from "h3";

/**
 * Nitro server route for Electric SQL proxy.
 * Handles /api/electric/[table] requests and forwards to Electric Cloud with credentials.
 */
export default defineEventHandler(async (event) => {
	const table = getRouterParam(event, "table");
	if (!table) {
		return new Response(JSON.stringify({ error: "Table name required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const tableName = table.replace(/-/g, "_");

	// Build Electric Cloud URL
	const electricUrl =
		process.env.ELECTRIC_URL || "https://api.electric-sql.cloud";
	const sourceId = process.env.ELECTRIC_SOURCE_ID;
	const secret = process.env.ELECTRIC_SECRET;

	if (!sourceId || !secret) {
		return new Response(
			JSON.stringify({ error: "Electric credentials not configured" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

	// Parse query params from original request
	const query = getQuery(event);
	const targetUrl = new URL(`${electricUrl}/v1/shape`);

	// Forward Electric protocol params
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined) {
			targetUrl.searchParams.set(key, String(value));
		}
	}

	// Add required params
	targetUrl.searchParams.set("table", tableName);
	targetUrl.searchParams.set("source_id", sourceId);
	targetUrl.searchParams.set("secret", secret);

	try {
		const response = await fetch(targetUrl.toString());

		// Build response headers, filtering out problematic ones
		const headers = new Headers();
		response.headers.forEach((value, key) => {
			if (
				!["content-encoding", "content-length", "transfer-encoding"].includes(
					key.toLowerCase(),
				)
			) {
				headers.set(key, value);
			}
		});

		const body = await response.text();
		return new Response(body, {
			status: response.status,
			headers,
		});
	} catch (error) {
		console.error("Electric proxy error:", error);
		return new Response(
			JSON.stringify({ error: "Failed to connect to Electric Cloud" }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
});
