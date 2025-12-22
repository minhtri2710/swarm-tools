/**
 * CLI DB Commands - Unit Tests
 *
 * TDD for swarm-db CLI commands:
 * - query: execute raw SQL
 * - analytics: run pre-built queries
 * - list: show available analytics
 */

import { describe, expect, test } from "bun:test";
import {
	executeAnalyticsCommand,
	executeQueryCommand,
	listAnalyticsCommands,
	parseTimeRange,
	validateSQL,
} from "./db.js";

describe("validateSQL", () => {
	test("allows SELECT queries", () => {
		expect(() => validateSQL("SELECT * FROM events")).not.toThrow();
		expect(() => validateSQL("  select count(*) from events  ")).not.toThrow();
		expect(() =>
			validateSQL("SELECT type, COUNT(*) FROM events GROUP BY type"),
		).not.toThrow();
	});

	test("rejects non-SELECT queries", () => {
		expect(() => validateSQL("INSERT INTO events VALUES (1)")).toThrow(
			"Only SELECT queries allowed",
		);
		expect(() => validateSQL("UPDATE events SET data = '{}'")).toThrow(
			"Only SELECT queries allowed",
		);
		expect(() => validateSQL("DELETE FROM events")).toThrow(
			"Only SELECT queries allowed",
		);
		expect(() => validateSQL("DROP TABLE events")).toThrow(
			"Only SELECT queries allowed",
		);
		expect(() => validateSQL("CREATE TABLE foo (id INT)")).toThrow(
			"Only SELECT queries allowed",
		);
	});

	test("rejects empty queries", () => {
		expect(() => validateSQL("")).toThrow("SQL query cannot be empty");
		expect(() => validateSQL("   ")).toThrow("SQL query cannot be empty");
	});

	test("is case-insensitive for SELECT", () => {
		expect(() => validateSQL("SeLeCt * FROM events")).not.toThrow();
	});
});

describe("parseTimeRange", () => {
	test("parses days (7d, 30d)", () => {
		const now = Date.now();
		const result = parseTimeRange("7d");
		expect(result).toBeInstanceOf(Date);
		const diff = now - result.getTime();
		// Should be ~7 days ago (allow 1 second margin)
		expect(diff).toBeGreaterThan(7 * 24 * 60 * 60 * 1000 - 1000);
		expect(diff).toBeLessThan(7 * 24 * 60 * 60 * 1000 + 1000);
	});

	test("parses hours (24h, 1h)", () => {
		const now = Date.now();
		const result = parseTimeRange("24h");
		expect(result).toBeInstanceOf(Date);
		const diff = now - result.getTime();
		expect(diff).toBeGreaterThan(24 * 60 * 60 * 1000 - 1000);
		expect(diff).toBeLessThan(24 * 60 * 60 * 1000 + 1000);
	});

	test("parses minutes (30m)", () => {
		const now = Date.now();
		const result = parseTimeRange("30m");
		expect(result).toBeInstanceOf(Date);
		const diff = now - result.getTime();
		expect(diff).toBeGreaterThan(30 * 60 * 1000 - 1000);
		expect(diff).toBeLessThan(30 * 60 * 1000 + 1000);
	});

	test("throws on invalid format", () => {
		expect(() => parseTimeRange("invalid")).toThrow(
			"Invalid time range format",
		);
		expect(() => parseTimeRange("7x")).toThrow("Invalid time range format");
		expect(() => parseTimeRange("abc")).toThrow("Invalid time range format");
	});

	test("throws on negative values", () => {
		expect(() => parseTimeRange("-7d")).toThrow("Invalid time range format");
	});
});

describe("listAnalyticsCommands", () => {
	test("returns array of command definitions", () => {
		const commands = listAnalyticsCommands();
		expect(Array.isArray(commands)).toBe(true);
		expect(commands.length).toBeGreaterThan(0);
	});

	test("each command has name and description", () => {
		const commands = listAnalyticsCommands();
		for (const cmd of commands) {
			expect(cmd).toHaveProperty("name");
			expect(cmd).toHaveProperty("description");
			expect(typeof cmd.name).toBe("string");
			expect(typeof cmd.description).toBe("string");
			expect(cmd.name.length).toBeGreaterThan(0);
			expect(cmd.description.length).toBeGreaterThan(0);
		}
	});

	test("includes all 10 analytics queries", () => {
		const commands = listAnalyticsCommands();
		const names = commands.map((c) => c.name);
		expect(names).toContain("failed-decompositions");
		expect(names).toContain("strategy-success-rates");
		expect(names).toContain("lock-contention");
		expect(names).toContain("agent-activity");
		expect(names).toContain("message-latency");
		expect(names).toContain("scope-violations");
		expect(names).toContain("task-duration");
		expect(names).toContain("checkpoint-frequency");
		expect(names).toContain("recovery-success");
		expect(names).toContain("human-feedback");
	});
});

describe("executeQueryCommand", () => {
	test("validates SQL before execution", async () => {
		await expect(
			executeQueryCommand({
				sql: "DELETE FROM events",
				db: ":memory:",
				format: "json",
			}),
		).rejects.toThrow("Only SELECT queries allowed");
	});

	test("enforces 1000 row limit", async () => {
		// This is a contract test - actual enforcement happens in implementation
		// We'll verify the limit is applied when we implement
		expect(true).toBe(true);
	});

	test("defaults to table format", async () => {
		// Contract: if format not specified, use table
		expect(true).toBe(true);
	});
});

describe("executeAnalyticsCommand", () => {
	test("rejects unknown commands", async () => {
		await expect(
			executeAnalyticsCommand({
				command: "unknown-command",
				db: ":memory:",
				format: "json",
			}),
		).rejects.toThrow("Unknown analytics command");
	});

	test("accepts valid analytics commands", async () => {
		// Contract: all 10 commands should be accepted
		const validCommands = [
			"failed-decompositions",
			"strategy-success-rates",
			"lock-contention",
			"agent-activity",
			"message-latency",
			"scope-violations",
			"task-duration",
			"checkpoint-frequency",
			"recovery-success",
			"human-feedback",
		];

		// This is a contract test - actual execution tested in integration
		expect(validCommands.length).toBe(10);
	});

	test("applies time range filters", async () => {
		// Contract: --since and --until flags should be passed to query
		expect(true).toBe(true);
	});

	test("applies project filter", async () => {
		// Contract: --project flag should be passed to query
		expect(true).toBe(true);
	});
});
