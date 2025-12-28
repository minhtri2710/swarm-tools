---
"opencode-swarm-plugin": patch
---

## 🐝 Plugin Wrapper Now Fully Self-Contained

```
    ┌──────────────────────────────────────────────────────────┐
    │                                                          │
    │   ~/.config/opencode/plugin/swarm.ts                     │
    │                                                          │
    │   ┌────────────────────────────────────────────────────┐ │
    │   │  BEFORE: import { ... } from "opencode-swarm-plugin"│ │
    │   │          ↓                                          │ │
    │   │  💥 Cannot find module 'evalite/runner'             │ │
    │   └────────────────────────────────────────────────────┘ │
    │                                                          │
    │   ┌────────────────────────────────────────────────────┐ │
    │   │  AFTER: // Inlined swarm detection (~250 lines)    │ │
    │   │         // Zero imports from npm package           │ │
    │   │         ↓                                          │ │
    │   │  ✅ Works everywhere                               │ │
    │   └────────────────────────────────────────────────────┘ │
    │                                                          │
    └──────────────────────────────────────────────────────────┘
```

**Problem:** Plugin wrapper in `~/.config/opencode/plugin/swarm.ts` was importing from `opencode-swarm-plugin` npm package. The package has `evalite` as a dependency, which isn't available in OpenCode's plugin context. Result: trace trap on startup.

**Solution:** Inline all swarm detection logic directly into the plugin wrapper template:
- `SwarmProjection`, `ToolCallEvent`, `SubtaskState`, `EpicState` types
- `projectSwarmState()` - event fold for deterministic state
- `hasSwarmSignature()` - quick check for epic + spawn
- `isSwarmActive()` - check for pending work
- `getSwarmSummary()` - human-readable status

**Design Principle:** The plugin wrapper must be FULLY SELF-CONTAINED:
- NO imports from `opencode-swarm-plugin` npm package
- All logic either inlined OR shells out to `swarm` CLI
- Users never need to update their local plugin for new features

**After updating:** Copy the new template to your local plugin:
```bash
cp ~/.config/opencode/plugin/swarm.ts ~/.config/opencode/plugin/swarm.ts.bak
# Then reinstall: bun add -g opencode-swarm-plugin
# Or copy from examples/plugin-wrapper-template.ts
```
