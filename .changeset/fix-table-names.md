---
"swarm-mail": patch
---

Fix table name mismatches and SQL alias typo in hive module

- jsonl.ts: Fixed DELETE queries using wrong table names (cell_* → bead_*)
- projections.ts: Fixed SQL alias typo (bcc.cell_id → bbc.cell_id)
