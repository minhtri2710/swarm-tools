/**
 * Query 1: Failed Decompositions
 *
 * Analyzes decomposition failures by strategy, showing which strategies
 * have the highest failure rates and average duration.
 */

import { QueryBuilder } from "../query-builder.js";
import type { AnalyticsQuery } from "../types.js";

export interface FailedDecompositionsFilters {
	project_key?: string;
	limit?: number;
}

/**
 * Build a query for failed decompositions grouped by strategy.
 *
 * Returns strategy, failure count, and average duration for all failed
 * subtask outcomes, ordered by failure count descending.
 *
 * @param filters - Optional filters for project_key and limit
 * @returns AnalyticsQuery ready for execution
 */
export function failedDecompositions(
	filters?: FailedDecompositionsFilters,
): AnalyticsQuery {
	const builder = new QueryBuilder()
		.select([
			"json_extract(data, '$.strategy') as strategy",
			"COUNT(*) as failure_count",
			"AVG(CAST(json_extract(data, '$.duration_ms') AS REAL)) as avg_duration_ms",
		])
		.from("events")
		.where("type = ?", ["subtask_outcome"])
		.where("json_extract(data, '$.success') = ?", ["false"])
		.groupBy("strategy")
		.orderBy("failure_count", "DESC")
		.withName("failed-decompositions")
		.withDescription(
			"Failed decomposition attempts grouped by strategy with failure counts and average duration",
		);

	if (filters?.project_key) {
		builder.where("project_key = ?", [filters.project_key]);
	}

	if (filters?.limit) {
		builder.limit(filters.limit);
	}

	return builder.build();
}
