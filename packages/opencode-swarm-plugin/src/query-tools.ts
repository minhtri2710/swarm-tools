/**
 * GREEN PHASE: SQL Query Tools Implementation
 * 
 * Provides:
 * - 10 preset queries for observability insights
 * - Custom SQL execution with timing
 * - 3 output formats: Table (box-drawing), CSV, JSON
 */

import type { DatabaseAdapter } from "swarm-mail";

// ============================================================================
// TYPES
// ============================================================================

export type PresetQueryName =
	| "failed_decompositions"
	| "duration_by_strategy"
	| "file_conflicts"
	| "worker_success_rate"
	| "review_rejections"
	| "blocked_tasks"
	| "agent_activity"
	| "event_frequency"
	| "error_patterns"
	| "compaction_stats";

export interface QueryResult {
	columns: string[];
	rows: Record<string, unknown>[];
	rowCount: number;
	executionTimeMs: number;
}

// ============================================================================
// PRESET QUERIES
// ============================================================================

export const presetQueries: Record<PresetQueryName, string> = {
	failed_decompositions: `
		SELECT 
			json_extract(data, '$.strategy') as strategy,
			json_extract(data, '$.error') as error,
			COUNT(*) as count
		FROM events
		WHERE type = 'decomposition_failed'
		GROUP BY strategy, error
		ORDER BY count DESC
	`,

	duration_by_strategy: `
		SELECT 
			json_extract(data, '$.strategy') as strategy,
			AVG(CAST(json_extract(data, '$.durationMs') AS REAL)) as avg_duration_ms,
			COUNT(*) as count
		FROM events
		WHERE type = 'subtask_outcome'
		GROUP BY strategy
		ORDER BY avg_duration_ms DESC
	`,

	file_conflicts: `
		SELECT 
			json_extract(value, '$') as file_path,
			COUNT(*) as reservation_count,
			GROUP_CONCAT(DISTINCT json_extract(data, '$.agent_name')) as agents
		FROM events,
			json_each(json_extract(data, '$.paths'))
		WHERE type = 'reservation_created'
		GROUP BY file_path
		HAVING COUNT(*) > 1
		ORDER BY reservation_count DESC
	`,

	worker_success_rate: `
		SELECT 
			json_extract(data, '$.agent_name') as agent_name,
			COUNT(*) as total,
			SUM(CAST(json_extract(data, '$.success') AS INTEGER)) as successes,
			CAST(SUM(CAST(json_extract(data, '$.success') AS INTEGER)) AS REAL) / COUNT(*) * 100 as success_rate
		FROM events
		WHERE type = 'subtask_outcome'
		GROUP BY agent_name
		ORDER BY success_rate DESC
	`,

	review_rejections: `
		SELECT 
			json_extract(data, '$.bead_id') as bead_id,
			json_extract(data, '$.agent_name') as agent_name,
			json_extract(data, '$.issues') as issues,
			timestamp
		FROM events
		WHERE type = 'review_feedback'
			AND json_extract(data, '$.status') = 'needs_changes'
		ORDER BY timestamp DESC
	`,

	blocked_tasks: `
		SELECT 
			json_extract(data, '$.bead_id') as bead_id,
			json_extract(data, '$.agent_name') as agent_name,
			json_extract(data, '$.epic_id') as epic_id,
			json_extract(data, '$.status') as status,
			timestamp
		FROM events
		WHERE json_extract(data, '$.status') = 'blocked'
		ORDER BY timestamp DESC
	`,

	agent_activity: `
		SELECT 
			json_extract(data, '$.agent_name') as agent_name,
			COUNT(*) as event_count,
			COUNT(DISTINCT type) as unique_event_types,
			MIN(timestamp) as first_seen,
			MAX(timestamp) as last_seen
		FROM events
		WHERE json_extract(data, '$.agent_name') IS NOT NULL
		GROUP BY agent_name
		ORDER BY event_count DESC
	`,

	event_frequency: `
		SELECT 
			strftime('%Y-%m-%d %H:00:00', datetime(timestamp / 1000, 'unixepoch')) as hour,
			type,
			COUNT(*) as count
		FROM events
		GROUP BY hour, type
		ORDER BY hour DESC, count DESC
	`,

	error_patterns: `
		SELECT 
			json_extract(data, '$.error') as error_message,
			type as event_type,
			COUNT(*) as occurrences,
			GROUP_CONCAT(DISTINCT json_extract(data, '$.agent_name')) as affected_agents
		FROM events
		WHERE json_extract(data, '$.error') IS NOT NULL
		GROUP BY error_message, event_type
		ORDER BY occurrences DESC
	`,

	compaction_stats: `
		SELECT 
			AVG(CAST(json_extract(data, '$.beforeSize') AS REAL)) as avg_before_size,
			AVG(CAST(json_extract(data, '$.afterSize') AS REAL)) as avg_after_size,
			AVG(CAST(json_extract(data, '$.ratio') AS REAL)) as avg_compression_ratio,
			COUNT(*) as compaction_count
		FROM events
		WHERE type = 'compaction'
	`,
};

// ============================================================================
// QUERY EXECUTION
// ============================================================================

/**
 * Execute custom SQL against the events table.
 * 
 * @param db - DatabaseAdapter instance
 * @param sql - SQL query string
 * @param params - Optional parameterized query values
 * @returns QueryResult with rows, columns, timing
 */
export async function executeQuery(
	db: DatabaseAdapter,
	sql: string,
	params?: unknown[],
): Promise<QueryResult> {
	const startTime = performance.now();
	
	const result = await db.query<Record<string, unknown>>(sql, params);
	
	const endTime = performance.now();
	const executionTimeMs = endTime - startTime;

	// Extract column names from first row
	const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

	return {
		columns,
		rows: result.rows,
		rowCount: result.rows.length,
		executionTimeMs,
	};
}

// ============================================================================
// OUTPUT FORMATTERS
// ============================================================================

/**
 * Format query result as aligned table with box-drawing characters.
 * 
 * Example output:
 * ┌──────────┬───────┐
 * │ name     │ count │
 * ├──────────┼───────┤
 * │ AgentA   │     5 │
 * │ AgentB   │     3 │
 * └──────────┴───────┘
 * 2 rows in 5.2ms
 */
export function formatAsTable(result: QueryResult): string {
	const { columns, rows, rowCount, executionTimeMs } = result;

	// Handle empty result set
	if (rows.length === 0) {
		const header = columns.join(" │ ");
		const width = header.length + 4;
		const footer = `0 rows in ${executionTimeMs.toFixed(1)}ms`;
		return [
			`┌${"─".repeat(width - 2)}┐`,
			`│ ${header} │`,
			`└${"─".repeat(width - 2)}┘`,
			footer.padEnd(width),
		].join("\n");
	}

	// Calculate column widths
	const widths: number[] = columns.map((col, idx) => {
		const colWidth = col.length;
		const maxDataWidth = Math.max(
			...rows.map((row) => {
				const val = row[col];
				return String(val ?? "NULL").length;
			}),
		);
		return Math.max(colWidth, maxDataWidth);
	});

	// Build rows
	const lines: string[] = [];

	// Top border
	const topBorder = `┌${widths.map((w) => "─".repeat(w + 2)).join("┬")}┐`;
	lines.push(topBorder);

	// Header
	const headerCells = columns.map((col, idx) => 
		` ${col.padEnd(widths[idx])} `
	);
	lines.push(`│${headerCells.join("│")}│`);

	// Separator
	lines.push(
		`├${widths.map((w) => "─".repeat(w + 2)).join("┼")}┤`,
	);

	// Data rows
	for (const row of rows) {
		const cells = columns.map((col, idx) => {
			const val = row[col];
			const str = val === null || val === undefined ? "NULL" : String(val);
			return ` ${str.padEnd(widths[idx])} `;
		});
		lines.push(`│${cells.join("│")}│`);
	}

	// Bottom border
	const bottomBorder = `└${widths.map((w) => "─".repeat(w + 2)).join("┴")}┘`;
	lines.push(bottomBorder);

	// Footer - pad to match table width
	const footer = `${rowCount} rows in ${executionTimeMs.toFixed(1)}ms`;
	const tableWidth = topBorder.length;
	lines.push(footer.padEnd(tableWidth));

	return lines.join("\n");
}

/**
 * Format query result as CSV with proper escaping.
 * 
 * Escapes:
 * - Commas → wrap in quotes
 * - Quotes → double them
 * - Newlines → wrap in quotes
 */
export function formatAsCSV(result: QueryResult): string {
	const { columns, rows } = result;

	const lines: string[] = [];

	// Header
	lines.push(columns.join(","));

	// Data rows
	for (const row of rows) {
		const cells = columns.map((col) => {
			const val = row[col];
			const str = val === null || val === undefined ? "" : String(val);

			// Check if escaping needed
			if (str.includes(",") || str.includes('"') || str.includes("\n")) {
				// Escape quotes by doubling them
				const escaped = str.replace(/"/g, '""');
				return `"${escaped}"`;
			}

			return str;
		});
		lines.push(cells.join(","));
	}

	return lines.join("\n");
}

/**
 * Format query result as pretty-printed JSON array.
 * 
 * Example:
 * [
 *   { "name": "AgentA", "count": 5 },
 *   { "name": "AgentB", "count": 3 }
 * ]
 */
export function formatAsJSON(result: QueryResult): string {
	return JSON.stringify(result.rows, null, 2);
}
