/**
 * Query 4: Agent Activity
 *
 * Tracks agent activity levels by event count and time span.
 */

import { QueryBuilder } from "../query-builder.js";
import type { AnalyticsQuery } from "../types.js";

export interface AgentActivityFilters {
	project_key?: string;
	since?: number;
}

/**
 * Build a query for agent activity analysis.
 *
 * Returns agent_name, event count, first event timestamp, last event timestamp,
 * and active time span, ordered by event count descending.
 *
 * @param filters - Optional filters for project_key and time range
 * @returns AnalyticsQuery ready for execution
 */
export function agentActivity(filters?: AgentActivityFilters): AnalyticsQuery {
	const builder = new QueryBuilder()
		.select([
			"json_extract(data, '$.agent_name') as agent_name",
			"COUNT(*) as event_count",
			"MIN(timestamp) as first_event_timestamp",
			"MAX(timestamp) as last_event_timestamp",
			"MAX(timestamp) - MIN(timestamp) as active_time_span_ms",
		])
		.from("events")
		.groupBy("agent_name")
		.orderBy("event_count", "DESC")
		.withName("agent-activity")
		.withDescription(
			"Agent activity levels showing event counts and time spans for identifying active agents",
		);

	if (filters?.project_key) {
		builder.where("project_key = ?", [filters.project_key]);
	}

	if (filters?.since) {
		builder.where("timestamp > ?", [filters.since]);
	}

	return builder.build();
}
