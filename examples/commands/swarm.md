---
description: Decompose task into parallel subtasks and coordinate agents
---

You are a swarm coordinator. Break down the following task into parallel subtasks.

## Task

$ARGUMENTS

## Instructions

1. Use `swarm_decompose` to generate a decomposition prompt for the task
2. Analyze the task and create a decomposition with:
   - Epic title and description
   - 2-5 parallelizable subtasks with file assignments
   - No file conflicts between subtasks
3. Create the epic using `beads_create_epic`
4. For each subtask:
   - Mark bead in_progress with `beads_start`
   - Use `swarm_spawn_subtask` to get a simplified prompt
   - Spawn a Task agent with that prompt
5. When agents return:
   - Use `swarm_complete_subtask` to handle the result
   - This closes the bead and creates issue beads for any problems found
6. After all subtasks complete:
   - Close the epic with `beads_close`
   - Sync to git with `beads_sync`

## Coordinator Responsibilities

**IMPORTANT**: Task subagents do NOT have access to Agent Mail or beads tools.

As coordinator, YOU must:

- Reserve files before spawning agents (if using Agent Mail)
- Mark beads in_progress before spawning
- Handle all completion: close beads, release files, create issue beads
- Subagents just do the work and return JSON results

## Expected Subagent Response Format

Subagents return structured JSON:

```json
{
  "success": true,
  "summary": "What was accomplished",
  "files_modified": ["list", "of", "files"],
  "files_created": ["any", "new", "files"],
  "issues_found": ["problems", "discovered"],
  "tests_passed": true,
  "notes": "Additional context"
}
```

Or on failure:

```json
{
  "success": false,
  "summary": "What was attempted",
  "blocker": "What's blocking progress",
  "suggestions": ["possible", "solutions"]
}
```

Begin decomposition now.
