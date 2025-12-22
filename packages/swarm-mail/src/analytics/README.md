# Analytics Module

Type-safe SQL query builder and result formatters for swarm-mail analytics.

## Quick Start

```typescript
import { QueryBuilder, formatTable } from "swarm-mail";

// Build a query
const query = new QueryBuilder()
  .select(["type", "COUNT(*) as count"])
  .from("events")
  .where("project_key = ?", ["my-project"])
  .groupBy("type")
  .orderBy("count", "DESC")
  .limit(10)
  .withName("event-counts")
  .withDescription("Event type counts by project")
  .build();

// Execute (you provide the database adapter)
const result = await db.query(query.sql, Object.values(query.parameters || {}));

// Format output
console.log(formatTable(result));
```

## QueryBuilder API

Fluent interface for constructing SQL queries:

- `.select(columns: string[])` - SELECT clause
- `.from(table: string)` - FROM clause
- `.where(condition: string, params?: unknown[])` - WHERE clause (chainable)
- `.groupBy(column: string)` - GROUP BY clause
- `.having(condition: string, params?: unknown[])` - HAVING clause (chainable)
- `.orderBy(column: string, direction?: "ASC" | "DESC")` - ORDER BY clause
- `.limit(count: number)` - LIMIT clause
- `.withName(name: string)` - Set query name (for AnalyticsQuery.name)
- `.withDescription(desc: string)` - Set query description
- `.build()` - Returns `AnalyticsQuery`

### Parameterized Queries

Use `?` placeholders and pass parameter arrays to prevent SQL injection:

```typescript
const query = new QueryBuilder()
  .select(["*"])
  .from("events")
  .where("type = ?", ["message_sent"])
  .where("timestamp > ?", [Date.now() - 86400000])
  .build();

// query.parameters = { 0: "message_sent", 1: 1734886800000 }
// Execute with: db.query(query.sql, Object.values(query.parameters || {}))
```

## Output Formatters

Four formatters for different output needs:

### formatTable(result: QueryResult): string

ASCII table with aligned columns:

```
id | type              | timestamp
---+-------------------+---------------
1  | agent_registered  | 1734886800000
2  | message_sent      | 1734886700000
(2 rows)
```

### formatJSON(result: QueryResult): string

Pretty-printed JSON:

```json
{
  "columns": ["id", "type"],
  "rows": [{ "id": 1, "type": "agent_registered" }],
  "rowCount": 1,
  "executionTimeMs": 5
}
```

### formatCSV(result: QueryResult): string

RFC 4180 compliant CSV:

```
id,type,timestamp
1,agent_registered,1734886800000
2,message_sent,1734886700000
```

### formatJSONL(result: QueryResult): string

Newline-delimited JSON (one object per line):

```
{"id":1,"type":"agent_registered","timestamp":1734886800000}
{"id":2,"type":"message_sent","timestamp":1734886700000}
```

## Type Safety

All types are exported:

```typescript
import type { AnalyticsQuery, QueryResult, OutputFormat } from "swarm-mail";

const query: AnalyticsQuery = {
  name: "test",
  description: "Test query",
  sql: "SELECT * FROM events",
  parameters: { 0: "value" },
};

const result: QueryResult = {
  columns: ["id", "type"],
  rows: [{ id: 1, type: "test" }],
  rowCount: 1,
  executionTimeMs: 10,
};

const format: OutputFormat = "table"; // "table" | "json" | "csv" | "jsonl"
```

## Design Principles

1. **Type-safe** - Strong TypeScript types prevent errors
2. **Parameterized queries** - Prevent SQL injection
3. **Fluent API** - Chainable methods for readability
4. **Format flexibility** - Multiple output formats for different use cases
5. **RFC compliant** - CSV follows RFC 4180, JSONL follows spec

## Foundation for CLI

This module is the foundation for analytics CLI commands (subtasks 4 & 5).
Pre-built queries will use QueryBuilder, CLI will use formatters for output.
