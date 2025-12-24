---
"opencode-swarm-plugin": patch
---

## 🔬 Eval Capture Pipeline: Phase 1

> "The first step toward wisdom is getting things right. The second step is getting them wrong in interesting ways." — Marvin Minsky

Wire `captureDecomposition()` into `swarm_validate_decomposition` to record decomposition inputs/outputs for evaluation.

**What changed:**
- `swarm_validate_decomposition` now calls `captureDecomposition()` after successful validation
- Captures: epicId, projectPath, task, context, strategy, epicTitle, subtasks
- Data persisted to `.opencode/eval-data.jsonl` for Evalite consumption

**Why it matters:**
- Enables ground-truth collection from real swarm executions
- Foundation for decomposition quality evals
- Tracks what strategies work for which task types

**Tests added:**
- Verifies `captureDecomposition` called with correct params on success
- Verifies NOT called on validation failure
- Handles optional context/description fields

**Next:** Wire `captureSubtaskOutcome()` and `finalizeEvalRecord()` to complete the pipeline.
