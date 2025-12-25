---
"opencode-swarm-plugin": minor
---

## 🔭 Observability Swarm: See What the Bees Are Doing

> "The unexamined swarm is not worth coordinating." — Socrates, probably

Four parallel workers descended on the observability stack and emerged victorious. The compaction hook no longer runs in darkness, coordinator sessions are now viewable, and the docs finally explain what all those JSONL files are for.

### What's New

**Compaction Observability** (`src/compaction-observability.ts`)
- Metrics collector tracks phases: START → GATHER → DETECT → INJECT → COMPLETE
- Pattern extraction/skipping with reasons ("why didn't this get captured?")
- Timing breakdown per phase (analysis vs extraction vs storage)
- 15 tests (11 unit + 4 integration)

**`swarm log sessions` CLI**
- `swarm log sessions` — list all captured coordinator sessions
- `swarm log sessions <id>` — view events for a session (partial ID matching)
- `swarm log sessions --latest` — quick access to most recent
- `--type`, `--since`, `--limit`, `--json` filters
- 64 tests covering parsing, listing, filtering

**Coordinator Observability Docs**
- AGENTS.md: overview with quick commands
- evals/README.md: deep dive with ASCII flow diagrams, event type reference, JSONL examples, jq recipes

**Research: Coordinator Prompt Eval** (`.hive/analysis/coordinator-prompt-eval-research.md`)
- 26KB analysis of prompt iteration strategies
- Recommends: versioning + evalite (defer LLM-as-Judge to v0.34+)
- Implementation plan with effort estimates

### The Observability Story

```
CAPTURE ──────────► VIEW ──────────► SCORE
(eval-capture.ts)   (swarm log       (coordinator
                     sessions)        evals)
```

Now you can answer:
- "What did the last 10 compaction runs extract?"
- "Why didn't this pattern get captured?"
- "Which coordinator sessions had violations?"
