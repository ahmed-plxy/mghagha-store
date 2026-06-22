---
name: Users schema
description: Key columns and migration history for the users table
---

Phase 4 migration added `area_id INTEGER REFERENCES areas(id)` to users table.
Email and Google users must set area_id before accessing the app (enforced via needsCompleteProfile).
Phone users (legacy) are not required to set area_id.

**Why:** New registrations via email/Google have no area context — area is essential for showing local stores.

complete-profile step: area (required) + phone (optional).
