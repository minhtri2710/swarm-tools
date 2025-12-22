/**
 * Query 5: Message Latency
 *
 * Calculates p50, p95, p99 response times for messages.
 *
 * Note: SQLite doesn't have native percentile functions, so we use
 * a simplified approach that orders by latency and extracts values
 * at approximate percentile positions.
 */

import type { AnalyticsQuery } from "../types.js";

export interface MessageLatencyFilters {
	project_key?: string;
}

/**
 * Build a query for message latency percentiles.
 *
 * Returns approximate p50, p95, p99 latency values for messages.
 * Uses a CTE to compute latencies, then calculates percentiles.
 *
 * @param filters - Optional filters for project_key
 * @returns AnalyticsQuery ready for execution
 */
export function messageLatency(
	filters?: MessageLatencyFilters,
): AnalyticsQuery {
	// SQLite percentile approximation using window functions
	// We compute latency for each message, then use NTILE or approximate positions
	let sql = `
WITH latencies AS (
  SELECT
    json_extract(data, '$.latency_ms') as latency_ms
  FROM events
  WHERE type = 'message_acknowledged'
    AND json_extract(data, '$.latency_ms') IS NOT NULL
`;

	const params: unknown[] = [];

	if (filters?.project_key) {
		sql += "    AND project_key = ?\n";
		params.push(filters.project_key);
	}

	sql += `),
ordered_latencies AS (
  SELECT
    latency_ms,
    ROW_NUMBER() OVER (ORDER BY latency_ms) as row_num,
    COUNT(*) OVER () as total_count
  FROM latencies
)
SELECT
  MAX(CASE WHEN row_num = CAST(total_count * 0.50 AS INTEGER) THEN latency_ms END) as p50_latency_ms,
  MAX(CASE WHEN row_num = CAST(total_count * 0.95 AS INTEGER) THEN latency_ms END) as p95_latency_ms,
  MAX(CASE WHEN row_num = CAST(total_count * 0.99 AS INTEGER) THEN latency_ms END) as p99_latency_ms
FROM ordered_latencies`;

	return {
		name: "message-latency",
		description:
			"Message latency percentiles (p50, p95, p99) for performance analysis",
		sql,
		parameters:
			params.length > 0
				? params.reduce<Record<string, unknown>>((acc, param, idx) => {
						acc[idx] = param;
						return acc;
					}, {})
				: undefined,
	};
}
