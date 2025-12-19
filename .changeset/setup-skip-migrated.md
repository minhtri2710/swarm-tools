---
"opencode-swarm-plugin": patch
"swarm-mail": patch
---

## 🐝 Setup Skips Already-Migrated Memories

`swarm setup` now detects when semantic memories have already been migrated and skips the migration prompt entirely.

**Before:** Setup would prompt "Migrate to swarm-mail database?" even when all memories were already migrated, then hang.

**After:** Setup checks if target database has memories first. If already migrated, shows dim "Already migrated to swarm-mail" and moves on.

**Changes:**

- Added `targetHasMemories(targetDb)` function to swarm-mail
- Updated setup flow to check target before prompting
- Fixed connection cleanup in all code paths (try/finally pattern)
- Suppressed internal PGLite NOTICE messages from user output

**Root cause of hang:** PGLite connection wasn't being closed in all paths, keeping the Node.js event loop alive indefinitely.
