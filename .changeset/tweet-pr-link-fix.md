---
"opencode-swarm-plugin": patch
---

## 🔗 Tweets Now Link to the Right PR

Release tweets were linking to the wrong PR. The old logic grabbed "most recent merged PR that isn't a version bump" - but with the new `release:` prefix on version PRs, it was picking up stale PRs.

**Fixed:** Now uses `github.sha` to find the exact PR that triggered the workflow. No more guessing.

```
BEFORE: gh pr list --limit 5 --jq 'filter...'  → wrong PR
AFTER:  gh pr list --search "${{ github.sha }}" → triggering PR
```
