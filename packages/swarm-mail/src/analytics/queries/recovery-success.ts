/**
 * Recovery Success Query
 *
 * Calculates success rate for deferred task resolution.
 * Tracks how often deferred tasks resolve successfully vs fail.
 */

import type { AnalyticsQuery } from "../types.js";

/**
 * Pre-built query to measure recovery success rate.
 *
 * Calculates percentage of deferred tasks that resolved successfully
 * vs those that were rejected or failed.
 *
 * @example
 * ```typescript
 * const adapter = await getSwarmMailLibSQL(projectPath);
 * const db = await adapter.getDatabase();
 * const result = await db.query(recoverySuccess.sql);
 * ```
 */
export const recoverySuccess: AnalyticsQuery & {
	buildQuery?: (filters: { project_key?: string }) => AnalyticsQuery;
} = {
	name: "recovery-success",
	description:
		"Recovery success rate - percentage of deferred tasks that resolved successfully",
	sql: `
    SELECT 
      COUNT(CASE WHEN type = 'deferred_resolved' THEN 1 END) as resolved_count,
      COUNT(CASE WHEN type = 'deferred_rejected' THEN 1 END) as rejected_count,
      COUNT(*) as total_count,
      CAST(COUNT(CASE WHEN type = 'deferred_resolved' THEN 1 END) AS REAL) / NULLIF(COUNT(*), 0) * 100 as success_rate_pct
    FROM events
    WHERE type IN ('deferred_resolved', 'deferred_rejected')
  `,
	buildQuery: (filters: { project_key?: string }) => {
		if (filters.project_key) {
			return {
				name: "recovery-success",
				description:
					"Recovery success rate - percentage of deferred tasks that resolved successfully",
				sql: `
          SELECT 
            COUNT(CASE WHEN type = 'deferred_resolved' THEN 1 END) as resolved_count,
            COUNT(CASE WHEN type = 'deferred_rejected' THEN 1 END) as rejected_count,
            COUNT(*) as total_count,
            CAST(COUNT(CASE WHEN type = 'deferred_resolved' THEN 1 END) AS REAL) / NULLIF(COUNT(*), 0) * 100 as success_rate_pct
          FROM events
          WHERE type IN ('deferred_resolved', 'deferred_rejected')
            AND project_key = ?
        `,
				parameters: { 0: filters.project_key },
			};
		}
		return recoverySuccess;
	},
};
