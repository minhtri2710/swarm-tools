---
"swarm-mail": patch
"opencode-swarm-plugin": patch
---

## 🧪 Bulletproof Test Suite

> "Setting up our tests to run synchronously and using mocking libraries will greatly speed up our testing"
> — ng-book

Fixed test isolation issues that caused 19 tests to fail when run together but pass in isolation.

### The Culprits

**1. Global fetch pollution** (`ollama.test.ts`)
```typescript
// BEFORE: Replaced global.fetch, never restored it
global.fetch = mockFetch;

// AFTER: Save and restore
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
```

**2. Port conflicts** (`durable-server.test.ts`)
- Tests used hardcoded ports (4483, 4484, 4485)
- Parallel test runs fought over the same ports
- Fixed: Use `port: 0` for OS-assigned ports, made `server.url` a getter

**3. AI SDK schema incompatibility** (`memory-operations.ts`)
- `z.discriminatedUnion` creates `oneOf` at top level
- Anthropic API requires `type: object` at top level
- Fixed: Flat object schema with optional fields

### Test Stats
```
Before: 19 failures when run together
After:  0 failures, 1406 tests pass
```

### Files Changed
- `src/memory/ollama.test.ts` - Restore global.fetch after each test
- `src/streams/durable-server.ts` - Dynamic port getter
- `src/streams/durable-server.test.ts` - Use port 0, rewrite for isolation
- `src/memory/memory-operations.ts` - Flat schema for Anthropic compatibility
- Renamed `memory-operations.test.ts` → `memory-operations.integration.test.ts`
