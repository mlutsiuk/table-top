# 🔒 Security audit log

Running list of security findings. Nothing gets closed silently — an item moves to
**Fixed** only with the commit/date that closed it, so the history stays readable.

Status: `OPEN` · `FIXED` · `ACCEPTED` (known, deliberately tolerated for now)

---

## Open

### SEC-005 · Stack traces returned in API error responses
**Severity:** low · **Found:** 2026-08-02

tRPC includes `stack` with absolute filesystem paths in error payloads outside
production mode. Harmless locally; must not reach a deployed environment.

**Action:** confirm `NODE_ENV=production` is set wherever the app is deployed, then
re-test one failing request and close this.

### SEC-006 · Access token cookie has no attributes
**Severity:** medium · **Found:** 2026-08-02

`useCookie('access-token')` is created with no `maxAge`, `sameSite` or `secure`, and is
readable from JavaScript. It is also a session cookie, so it dies with the browser
while the JWT itself is valid for a day.

Full remedy is the refresh-token design in [auth.md](auth.md). Interim hardening is
still open for discussion.

---

## Fixed

### SEC-002 · Campaign details readable by any authenticated user — FIXED 2026-08-02
`campaign.getCampaignDetails` looked up by `id` only, so any logged-in account could
read any campaign by UUID. Verified before the fix: an unrelated user's token returned
`HTTP 200` with the owner's payload.

Closed by the role model rather than a one-line owner check, since players are supposed
to read campaigns too. Access now resolves through `server/utils/campaign-access.ts`:
master (the author) writes, players read, everyone else gets `NOT_FOUND` — deliberately
not `FORBIDDEN`, so campaign UUIDs cannot be probed for existence.

Re-tested with three accounts against a running server:

| | campaign read | tree read | folder create | folder rename | settings | add player |
|---|---|---|---|---|---|---|
| master | OK | OK | OK | OK | OK | OK |
| player | OK | OK | FORBIDDEN | FORBIDDEN | FORBIDDEN | FORBIDDEN |
| stranger | NOT_FOUND | NOT_FOUND | — | NOT_FOUND | — | — |

**Known gap, by design for now:** players see the *entire* material tree. There is no
notion of master-only notes yet. Whenever secret material becomes a requirement, it
needs a visibility flag on `Folder`/`Asset` and filtering in `folder.getTree` and
`asset.getById`.

### SEC-001 · `/api/users` served every user unauthenticated — FIXED 2026-08-02
`server/api/users/index.get.ts` returned every row of `users`, emails included, with no
auth check at all. Verified before the fix: `GET /api/users` with no header returned
`HTTP 200` and the full list.

Endpoint deleted outright — nothing used it except a debug page, which is gone too.
`server/api/user.get.ts` went with it as dead code; the client reads the current user
through `auth.getCurrentUser`.

Re-tested: the path now falls through to the SPA shell (`text/html`, no data).

### SEC-003 · `asset.create` trusted a client-supplied `campaignId` — FIXED 2026-08-02
The procedure verified ownership of `folderId` but wrote whatever `campaignId` the
caller sent, so an asset could be planted into another user's campaign — `getTree`
filters by `campaignId`, so it would have shown up in their sidebar.

`campaignId` was dropped from the input entirely and is now read off the verified
folder. Re-tested: creating into a foreign folder returns `NOT_FOUND`.

### SEC-004 · `move` did not validate the destination — FIXED 2026-08-02
`asset.move` and `folder.move` checked the thing being moved but never the target, so
an item could be reparented into another campaign — including another user's.

Both now resolve the destination scoped to the same campaign before writing. Re-tested:
moving into a foreign folder returns `NOT_FOUND`, moving within one's own campaign
still succeeds.

---

## Accepted

_(nothing yet)_
