---
"opencode-swarm-plugin": minor
---

## 🔭 Observability Stack: See What Your Swarm Is Doing

```
    ╭──────────────────────────────────────────────────────────╮
    │                                                          │
    │   "Observability is about instrumenting your system      │
    │    in a way that ensures sufficient information about    │
    │    a system's runtime is collected and analyzed so       │
    │    that when something goes wrong, it can help you       │
    │    understand why."                                      │
    │                                                          │
    │                    — AI Engineering, Chip Huyen          │
    │                                                          │
    ╰──────────────────────────────────────────────────────────╯
```

Five new modules for understanding multi-agent coordination at runtime:

### Error Enrichment (`error-enrichment.ts`)

```typescript
throw new SwarmError("File reservation failed", {
  file: "src/auth.ts",
  agent: "DarkHawk",
  epic_id: "mjmas3zxlmg",
  recent_events: [/* last 5 events */]
});
```

- `SwarmError` class with structured context (file, line, agent, epic, events)
- `enrichError()` wraps any error with swarm context
- `debugLog()` respects `DEBUG=swarm:*` patterns
- `suggestFix()` maps 8+ error patterns to actionable fixes

### SQL Analytics (`swarm query`)

```bash
swarm query --preset failed_decompositions
swarm query --sql "SELECT * FROM events WHERE type='worker_spawned'"
swarm query --preset duration_by_strategy --format csv
```

10 preset queries: `failed_decompositions`, `duration_by_strategy`, `file_conflicts`, `worker_success_rate`, `review_rejections`, `blocked_tasks`, `agent_activity`, `event_frequency`, `error_patterns`, `compaction_stats`

### Dashboard Data (`swarm dashboard`)

```bash
swarm dashboard --epic mjmas3zxlmg --refresh 1000
```

Real-time data fetching: worker status, subtask progress, file locks, recent messages, epic list.

### Event Replay (`swarm replay`)

```bash
swarm replay mjmas3zxlmg --speed 2x --type worker_spawned
swarm replay mjmas3zxlmg --agent DarkHawk --since "2025-12-25T10:00:00"
```

Replay epic events with timing control. Filter by type, agent, time range. Debug coordination failures by watching the sequence unfold.

### Export Formats (`swarm export`)

```bash
swarm export --format otlp --epic mjmas3zxlmg  # OpenTelemetry traces
swarm export --format csv --output events.csv   # RFC 4180 compliant
swarm export --format json | jq '.[] | select(.type=="error")'
```

**Test Coverage:** 225 tests (150 unit + 75 CLI integration)

**TDD Enforced:** RED cells first, GREEN cells second. Every function tested before implementation.
