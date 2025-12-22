/**
 * Checkpoint Frequency Query
 *
 * Analyzes how often agents create checkpoints.
 * Useful for understanding checkpoint adoption and patterns.
 */

import type { AnalyticsQuery } from "../types.js";

/**
 * Pre-built query to measure checkpoint frequency per agent.
 *
 * Counts checkpoint_created events grouped by agent.
 * Shows which agents are actively using checkpoints.
 *
 * @example
 * ```typescript
 * const adapter = await getSwarmMailLibSQL(projectPath);
 * const db = await adapter.getDatabase();
 * const result = await db.query(checkpointFrequency.sql);
 * ```
 */
export const checkpointFrequency: AnalyticsQuery & {
	buildQuery?: (filters: { project_key?: string }) => AnalyticsQuery;
} = {
	name: "checkpoint-frequency",
	description:
		"How often agents checkpoint - measures checkpoint creation frequency per agent",
	sql: `
    SELECT 
      json_extract(data, '$.agent_name') as agent,
      COUNT(*) as checkpoint_count,
      MIN(timestamp) as first_checkpoint,
      MAX(timestamp) as last_checkpoint,
      (MAX(timestamp) - MIN(timestamp)) / NULLIF(COUNT(*) - 1, 0) as avg_interval_ms
    FROM events
    WHERE type = 'checkpoint_created'
    GROUP BY json_extract(data, '$.agent_name')
    ORDER BY checkpoint_count DESC
  `,
	buildQuery: (filters: { project_key?: string }) => {
		if (filters.project_key) {
			return {
				name: "checkpoint-frequency",
				description:
					"How often agents checkpoint - measures checkpoint creation frequency per agent",
				sql: `
          SELECT 
            json_extract(data, '$.agent_name') as agent,
            COUNT(*) as checkpoint_count,
            MIN(timestamp) as first_checkpoint,
            MAX(timestamp) as last_checkpoint,
            (MAX(timestamp) - MIN(timestamp)) / NULLIF(COUNT(*) - 1, 0) as avg_interval_ms
          FROM events
          WHERE type = 'checkpoint_created'
            AND project_key = ?
          GROUP BY json_extract(data, '$.agent_name')
          ORDER BY checkpoint_count DESC
        `,
				parameters: { 0: filters.project_key },
			};
		}
		return checkpointFrequency;
	},
};
