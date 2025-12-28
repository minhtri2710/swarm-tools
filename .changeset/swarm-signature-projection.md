---
"opencode-swarm-plugin": minor
---

## Swarm Signature Detection: Events as Source of Truth

> "Applications that use event sourcing need to take the log of events and transform it into
> application state that is suitable for showing to a user."
> — Martin Kleppmann, *Designing Data-Intensive Applications*

```
                    SESSION EVENTS                    HIVE (projection)
                    ═══════════════                   ═════════════════
                    
    ┌─────────────────────────────────┐              ┌─────────────────┐
    │ hive_create_epic(...)           │──────────────│ epic: open      │
    │ swarm_spawn_subtask(bd-123.1)   │              │ bd-123.1: open  │
    │ swarm_spawn_subtask(bd-123.2)   │              │ bd-123.2: open  │
    │ swarm_complete(bd-123.1)        │──────────────│ bd-123.1: closed│
    │ swarm_complete(bd-123.2)        │──────────────│ bd-123.2: closed│
    │ hive_close(epic)                │──────────────│ epic: closed    │
    └─────────────────────────────────┘              └─────────────────┘
              ↑                                               ↑
         SOURCE OF TRUTH                              STALE PROJECTION
         (immutable log)                              (all cells closed)
                                                      
    ┌──────────────────────────────────────────────────────────────────┐
    │  COMPACTION TRIGGERS HERE                                        │
    │  ════════════════════════                                        │
    │                                                                  │
    │  Old approach: Query hive → "0 open epics" → "No cells found"   │
    │  New approach: Fold events → "Epic with 2 subtasks, completed"  │
    └──────────────────────────────────────────────────────────────────┘
```

**The Problem:**

Compaction was detecting swarms (106 high-confidence tool calls) but finding no active epics.
Why? By the time compaction triggers, all cells are already **closed** in hive. The LLM was
generating useless continuation prompts because it queried the stale projection instead of
projecting from the event log.

**The Fix:**

New `swarm-signature.ts` module with deterministic, algorithmic swarm detection:

```typescript
// A SWARM is defined by this event sequence (no heuristics):
// 1. hive_create_epic(epic_title, subtasks[]) → epic_id
// 2. swarm_spawn_subtask(bead_id, epic_id, ...) → prompt (at least one)

// Pure fold over events produces ground truth state
const projection = projectSwarmState(sessionEvents);

// projection.epics: Map<epicId, { title, subtaskIds, status }>
// projection.subtasks: Map<subtaskId, { epicId, status, agent, files }>
// projection.spawned: Set<subtaskId>  // Actually spawned to workers
// projection.completed: Set<subtaskId>  // Finished via swarm_complete
```

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `projectSwarmState()` | Fold over events → SwarmProjection |
| `hasSwarmSignature()` | Quick check: epic + spawn present? |
| `isSwarmActive()` | Any pending work? |
| `getSwarmSummary()` | Human-readable status for prompts |

**Integration:**

`scanSessionMessages()` now returns `projection` alongside tool call stats. The compaction
hook uses projection as PRIMARY source, hive_query as fallback. Logs show `source: "projection"`
vs `source: "hive_query"` for debugging.

**Why This Matters:**

Coordinators waking up after compaction now get accurate state:
- "Epic 'Add Auth' with 3/5 subtasks complete, 2 pending"
- Instead of: "No cells found"

The session event log is the source of truth. Hive is just a convenient projection that
can become stale. Now we project from events when it matters.
