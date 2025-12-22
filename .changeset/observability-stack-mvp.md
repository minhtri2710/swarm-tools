---
"swarm-mail": minor
"opencode-swarm-plugin": minor
---

## 🔭 Observability Stack MVP: See What Your Swarm Is Doing

> "You can't improve what you can't measure." — Peter Drucker

The swarm just got eyes. This release adds comprehensive observability for multi-agent coordination, answering the eternal question: "Why did my epic fail?"

### What's New

**Structured Error Classes** (swarm-mail)
- `BaseSwarmError` with rich context: agent, bead_id, epic_id, timestamp, recent events
- Specialized errors: `ReservationError`, `CheckpointError`, `ValidationError`, `DecompositionError`
- Every error includes actionable suggestions for resolution
- Full `toJSON()` serialization for logging and debugging

**DEBUG Logging** (swarm-mail)
- `DEBUG=swarm:*` environment variable filtering
- 4 subsystems: `swarm:events`, `swarm:reservations`, `swarm:messages`, `swarm:checkpoints`
- Zero overhead when disabled

**swarm-db CLI** (swarm-mail)
```bash
# Raw SQL queries (SELECT only, max 1000 rows)
swarm-db query "SELECT type, COUNT(*) FROM events GROUP BY type"

# Pre-built analytics
swarm-db analytics failed-decompositions --since 7d --format json

# List available analytics
swarm-db list
```

**10 Pre-built Analytics Queries** (Four Golden Signals mapped)
| Query | What It Answers |
|-------|-----------------|
| `failed-decompositions` | Which strategies are failing? |
| `strategy-success-rates` | What's working? |
| `lock-contention` | Where are agents fighting over files? |
| `agent-activity` | Who's doing what? |
| `message-latency` | How fast is coordination? |
| `scope-violations` | Who's touching files they shouldn't? |
| `task-duration` | How long do tasks take? |
| `checkpoint-frequency` | Are agents checkpointing enough? |
| `recovery-success` | Do checkpoints actually help? |
| `human-feedback` | What are reviewers rejecting? |

**Agent-Facing Tools** (opencode-swarm-plugin)
```typescript
// Query analytics programmatically
swarm_analytics({ query: "failed-decompositions", since: "7d", format: "summary" })

// Raw SQL for power users (max 50 rows, context-safe)
swarm_query({ sql: "SELECT * FROM events WHERE type = 'task_blocked'" })

// Auto-diagnosis for debugging
swarm_diagnose({ epic_id: "bd-123", include: ["blockers", "errors", "timeline"] })

// Learning insights for feedback loops
swarm_insights({ scope: "epic", metrics: ["success_rate", "avg_duration"] })
```

### Why This Matters

Before: "The swarm failed. No idea why."
After: "Strategy X failed 80% of the time due to file conflicts. Switching to Y."

Event sourcing was already 80% of the solution. This release adds the diagnostic views to make that data actionable.

### Test Coverage

- 588 tests passing
- 1214 assertions
- Full TDD: every feature started with a failing test
