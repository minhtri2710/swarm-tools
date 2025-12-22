/**
 * Query 2: Strategy Success Rates
 *
 * Calculates success rate percentage for each decomposition strategy.
 */

import { QueryBuilder } from "../query-builder.js";
import type { AnalyticsQuery } from "../types.js";

export interface StrategySuccessRatesFilters {
	project_key?: string;
}

/**
 * Build a query for strategy success rates.
 *
 * Returns strategy, total attempts, successful count, failed count, and
 * success rate percentage, ordered by success rate descending.
 *
 * @param filters - Optional filters for project_key
 * @returns AnalyticsQuery ready for execution
 */
export function strategySuccessRates(
	filters?: StrategySuccessRatesFilters,
): AnalyticsQuery {
	const builder = new QueryBuilder()
		.select([
			"json_extract(data, '$.strategy') as strategy",
			"COUNT(*) as total_attempts",
			"SUM(CASE WHEN json_extract(data, '$.success') = 'true' THEN 1 ELSE 0 END) as successful_count",
			"SUM(CASE WHEN json_extract(data, '$.success') = 'false' THEN 1 ELSE 0 END) as failed_count",
			"ROUND(CAST(SUM(CASE WHEN json_extract(data, '$.success') = 'true' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 2) as success_rate",
		])
		.from("events")
		.where("type = ?", ["subtask_outcome"])
		.groupBy("strategy")
		.orderBy("success_rate", "DESC")
		.withName("strategy-success-rates")
		.withDescription(
			"Success rate percentage by decomposition strategy, showing which strategies work best",
		);

	if (filters?.project_key) {
		builder.where("project_key = ?", [filters.project_key]);
	}

	return builder.build();
}
