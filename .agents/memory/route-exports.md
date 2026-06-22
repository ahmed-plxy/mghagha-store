---
name: Route file exports
description: Routes registered after module.exports in Express are silently unreachable — always place module.exports last.
---

Any route registered on `router` after `module.exports = router` is silently ignored by Node's module system — the exported object is a snapshot of the router at the time of export, so later `.get()`/`.post()` calls on that same variable have no effect on callers.

**Why:** Discovered during full audit — admin push-notifications, app-version, and classifieds-moderation routes, plus the public `/api/app-version` route, were all dead because `module.exports` appeared mid-file.

**How to apply:** Always put `module.exports = router;` as the very last line of every route file. If adding new routes to an existing file, check where module.exports sits before appending.
