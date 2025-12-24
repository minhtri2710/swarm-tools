---
"opencode-swarm-plugin": patch
---

## 🎯 Coordinators Remember Who They Are

Fixed the compaction bug where coordinators lost their identity after context compression.

**The Problem:**
After compaction, coordinators would wake up and start doing worker tasks directly (running tests, editing files) instead of spawning workers. The injected context said "you are a coordinator" but gave worker-style resume commands.

**The Fix:**
`buildDynamicSwarmState()` now generates coordinator-focused context:

```
## 🎯 YOU ARE THE COORDINATOR

**Primary role:** Orchestrate workers, review their output, unblock dependencies.
**Spawn workers** for implementation tasks - don't do them yourself.

**RESUME STEPS:**
1. Check swarm status: `swarm_status(epic_id="bd-actual-id", ...)`
2. Check inbox: `swarmmail_inbox(limit=5)`
3. For in_progress subtasks: Review with `swarm_review`
4. For open subtasks: Spawn workers with `swarm_spawn_subtask`
5. For blocked subtasks: Investigate and unblock
```

Also captures specific swarm state during detection:
- Epic ID and title (not placeholders)
- Subtask counts by status
- Actual project path

**New eval infrastructure:**
- `coordinator-behavior.eval.ts` - LLM-as-judge eval testing whether Claude actually behaves like a coordinator given the injected context
- Scorers for coordinator tools, avoiding worker behaviors, and coordinator mindset

> "The coordinator's job is to keep the swarm cooking, not to cook themselves."
