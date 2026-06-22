---
name: Schema canonical
description: schema.sql is now the full canonical schema; migrate.js runs ALTER TABLE upgrades for existing databases.
---

`src/db/schema.sql` is now the single source of truth for the full database structure. It includes all tables, columns, and partial indexes as they should exist on a fresh install.

`src/db/migrate.js` is layered on top — it runs `db.exec(schema)` first (all CREATE TABLE IF NOT EXISTS, so safe on existing DBs), then applies ALTER TABLE changes for columns added after the initial schema was deployed. The try/catch on each ALTER means no-ops are safe.

**Why:** The original schema.sql was stale — it had `phone TEXT NOT NULL` (blocking nullable phones), a non-partial unique index on phone (blocking NULL values), and was missing many tables and columns added over 5 phases of migration. On fresh installs this caused subtle bugs before the migration rebuilt the table.

**Key rule:** When adding a new column/table in a migration phase in migrate.js, also add it to schema.sql so fresh installs get it without needing the ALTER.

**product_reports table:** Previously only existed in the orphan script `src/db/create-reports-table.js` (never auto-run). Now created in migrate.js Phase 5 AND in schema.sql.
