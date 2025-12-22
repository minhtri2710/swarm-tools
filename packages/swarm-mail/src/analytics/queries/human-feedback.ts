/**
 * Human Feedback Query
 *
 * Analyzes approval vs rejection rates from human review.
 * Tracks review_feedback events to measure quality control.
 */

import type { AnalyticsQuery } from "../types.js";

/**
 * Pre-built query to analyze human feedback patterns.
 *
 * Counts approvals vs rejections from review_feedback events.
 * Shows breakdown by status (approved vs needs_changes).
 *
 * @example
 * ```typescript
 * const adapter = await getSwarmMailLibSQL(projectPath);
 * const db = await adapter.getDatabase();
 * const result = await db.query(humanFeedback.sql);
 * ```
 */
export const humanFeedback: AnalyticsQuery & {
	buildQuery?: (filters: { project_key?: string }) => AnalyticsQuery;
} = {
	name: "human-feedback",
	description:
		"Approval/rejection breakdown - analyzes human review feedback patterns",
	sql: `
    SELECT 
      json_extract(data, '$.status') as status,
      COUNT(*) as count,
      CAST(COUNT(*) AS REAL) / (SELECT COUNT(*) FROM events WHERE type = 'review_feedback') * 100 as percentage
    FROM events
    WHERE type = 'review_feedback'
    GROUP BY json_extract(data, '$.status')
    ORDER BY count DESC
  `,
	buildQuery: (filters: { project_key?: string }) => {
		if (filters.project_key) {
			return {
				name: "human-feedback",
				description:
					"Approval/rejection breakdown - analyzes human review feedback patterns",
				sql: `
          SELECT 
            json_extract(data, '$.status') as status,
            COUNT(*) as count,
            CAST(COUNT(*) AS REAL) / (SELECT COUNT(*) FROM events WHERE type = 'review_feedback' AND project_key = ?) * 100 as percentage
          FROM events
          WHERE type = 'review_feedback'
            AND project_key = ?
          GROUP BY json_extract(data, '$.status')
          ORDER BY count DESC
        `,
				parameters: { 0: filters.project_key, 1: filters.project_key },
			};
		}
		return humanFeedback;
	},
};
