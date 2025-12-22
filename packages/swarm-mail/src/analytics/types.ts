/**
 * Analytics Query Builder Types
 *
 * Type-safe interfaces for SQL query construction and result formatting.
 */

/**
 * Represents a named analytics query with optional parameters.
 */
export interface AnalyticsQuery {
	/** Unique identifier for the query */
	name: string;
	/** Human-readable description of what the query does */
	description: string;
	/** SQL query string (may include ? placeholders for parameters) */
	sql: string;
	/** Optional parameters to bind to the SQL query */
	parameters?: Record<string, unknown>;
}

/**
 * Result of executing an analytics query.
 */
export interface QueryResult {
	/** Column names in result set */
	columns: string[];
	/** Result rows as objects (column name -> value) */
	rows: Record<string, unknown>[];
	/** Total number of rows returned */
	rowCount: number;
	/** Query execution time in milliseconds */
	executionTimeMs: number;
}

/**
 * Supported output formats for query results.
 */
export type OutputFormat = "table" | "json" | "csv" | "jsonl";
