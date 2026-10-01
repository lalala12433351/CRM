# How Pixbe CRM works

A short map of the running app: who calls what, and where filtering happens.

The app is one Node process. Express serves the API under `/api` and, in development, Vite serves the React UI. In production the same process serves the built files in `dist/`.

```
Browser (src/)  --fetchWithTenantAuth-->  Express (server/app.ts)
                                              |
                                              +-- auth + tenant
                                              +-- route module
                                              +-- service / repository
                                              +-- multiTenantDb (per-tenant data)
```

## How a request is authenticated

Almost every UI call goes through `fetchWithTenantAuth` in `src/lib/auth.ts`. It sends:

- `Authorization: Bearer <token>`
- `x-tenant-id: <workspace id>`
- `Content-Type: application/json` when the caller sets it

If the server answers `401`, that helper tries `POST /api/auth/restore` once and retries the original call.

On the server, `server/app.ts` runs two middlewares on `/api` before any route:

1. `authMiddleware` (`server/middleware/auth.ts`) reads the bearer token. Cognito JWTs are verified when Cognito is on. Otherwise it looks up the in-memory session. It sets `req.user` and `req.tenantId`.
2. `tenantContextMiddleware` pins later database reads and writes to that workspace.

Role checks are separate, in `server/middleware/rbac.ts`:

| Guard | Who gets through |
| --- | --- |
| `requireAuthenticated` | Any signed-in user |
| `requireManager` | Admin or Manager |
| `requireAdmin` | Admin only |

Webhooks stay public and are checked with their own secrets (Meta signature, Razorpay signature, lead webhook secret, Google Ads key). They are also rate-limited.

## Who can see which records

`getAccessScope` in `server/utils/accessScope.ts` decides the server-side slice before data is returned:

| Role | What they can load |
| --- | --- |
| Admin | The whole workspace (`isAdmin: true`, empty `agentIds`) |
| Manager | Themselves plus agents whose `managerId` is them |
| Telecaller | Only their own id |

Lead reads use that scope inside `multiTenantDb.getLeads`. A non-admin only gets leads whose `ownerAgentId` or `assignedTo` is in their allowed ids. Saving or deleting a lead outside that set returns `403`.

The leads screen also applies the same idea in the browser (`matchesAgent` in `src/utils/agentDisplay.ts`), so a telecaller list stays limited to their own leads even after the payload arrives.

## API map

All paths below are under `/api`. The UI loads the main workspace in one batch from `src/App.tsx` (`/leads`, `/agents`, `/pipelines`, `/field-settings`, `/tasks`, `/pipelines/lost-reasons`, `/activities`, `/calls`, `/campaigns`, `/messages`, `/whatsapp-templates`, `/whatsapp-campaigns`, `/workspace/settings`).

### Auth — `server/modules/auth`

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/auth/send-otp` | Email an OTP |
| POST | `/auth/verify-otp` | Check the OTP |
| POST | `/auth/register` | Create the account / workspace |
| POST | `/auth/login` | Sign in |
| POST | `/auth/restore` | Rebuild a session from a stored token |
| GET | `/auth/me` | Current user |
| PUT | `/auth/profile` | Update profile |
| POST | `/auth/logout` | End the session |
| DELETE | `/auth/account` | Delete the account |
| POST | `/auth/password-change/request` | Start a password change |
| POST | `/auth/password-change/forgot` | Forgot-password OTP |
| POST | `/auth/password-change/confirm` | Confirm the new password |

### Leads — `server/modules/leads`

| Method | Path | Who | What it does |
| --- | --- | --- | --- |
| GET | `/leads` | Signed in | Leads inside the caller's access scope |
| POST | `/leads` | Signed in | Create or upsert a lead. Telecallers are forced onto their own owner id |
| PUT | `/leads/:id` | Signed in | Same save path, id taken from the URL |
| DELETE | `/leads/:id` | Signed in | Delete, if the lead is in scope |
| GET | `/field-settings` | Signed in | Custom field definitions |
| POST | `/field-settings` | Admin | Save field definitions |
| GET | `/activities` | Signed in | Activity log |
| POST | `/activities` | Signed in | Append an activity |
| DELETE | `/activities/:id` | Signed in | Remove an activity |

Lead search and the condition builder do **not** hit a query-string filter on this endpoint. `GET /leads` returns the scoped list, and the page filters it in the browser. See [Filtering](#filtering) below.

### Team, tasks, calls

| Method | Path | Who | What it does |
| --- | --- | --- | --- |
| GET | `/agents` | Signed in | Workspace users |
| POST | `/agents` | Admin | Add a user |
| PUT | `/agents/:id` | Admin | Update a user |
| DELETE | `/agents/:id` | Admin | Remove a user |
| GET/POST | `/tasks` | Signed in | List / create tasks |
| PUT/DELETE | `/tasks/:id` | Signed in | Update / delete a task |
| GET/POST | `/calls` | Signed in | List / log calls |
| PUT | `/calls/:id` | Signed in | Update a call |
| POST | `/calls/:id/recording` | Signed in | Upload a recording |
| POST | `/calls/:id/recording-status` | Signed in | Update recording status |
| GET | `/calls/:id/recording` | Signed in | Recording metadata |
| GET | `/calls/:id/recording/file` | Token on the request | The audio file |
| DELETE | `/calls/:id` | Signed in | Delete a call |

### Pipelines and conversions — `server/modules/pipelines`

| Method | Path | What it does |
| --- | --- | --- |
| GET/POST | `/pipelines` | Stages |
| GET/POST | `/pipelines/lost-reasons` | Lost-reason list |
| GET/POST | `/conversions/settings` | Conversion tracking settings |
| GET | `/conversions/queue` | Pending conversion events |
| POST | `/conversions/dispatch` | Send one conversion |
| POST | `/conversions/retry-all` | Retry the queue |
| GET | `/analytics/campaign-quality` | Campaign quality numbers |

### Reports — `server/modules/reports`

`GET /reports/call-logs` is manager-or-admin only. Telecallers get `403`.

Query string (all optional):

| Param | Meaning |
| --- | --- |
| `userId` | One agent. `ALL` means no extra user cut |
| `managerId` | That manager's team. `ALL` means no extra team cut |
| `from`, `to` | Dates as `YYYY-MM-DD` |
| `search` | Text match on lead name, phone, agent, notes |
| `disposition` | Exact call disposition. `ALL` skips this |
| `type` | Call type (`outgoing` is the default when a call has none). `ALL` skips this |
| `sort` | `newest` (default), `oldest`, `duration_desc`, `duration_asc` |

The page that calls this is `src/pages/ReportsPage.tsx`.

### Workflows, templates, actions, campaigns, messages

| Method | Path | What it does |
| --- | --- | --- |
| GET/POST | `/workflows` | List / save workflows |
| PUT | `/workflows/:id/toggle` | Turn a workflow on or off |
| DELETE | `/workflows/:id` | Delete a workflow |
| GET/POST | `/templates` | Message / API templates |
| DELETE | `/templates/:id` | Delete a template |
| POST | `/templates/test` | Run a template against a test payload |
| GET/POST | `/actions` | Saved workflow actions |
| DELETE | `/actions/:id` | Delete an action |
| GET/POST | `/campaigns` | List (manager+) / save (admin) |
| DELETE | `/campaigns/:id` | Delete (admin). Same routes exist under `/workspace/campaigns` |
| GET/POST | `/messages` | Inbox messages |
| GET/POST | `/whatsapp-templates` | WhatsApp templates |
| GET/POST | `/whatsapp-campaigns` | WhatsApp campaigns |

### Workspace

| Method | Path | Who | What it does |
| --- | --- | --- | --- |
| GET | `/workspace/webhook-secrets` | Signed in | Lead webhook URL and secret |
| GET | `/workspace/settings` | Signed in | Workspace settings |
| PUT | `/workspace/settings` | Admin | Save workspace settings |

### AI — `server/modules/ai`

All POST: `/ai/score-lead`, `/ai/transcribe-call`, `/ai/generate-whatsapp`, `/ai/voice-bot-interview`, `/ai/business-insights`.

### Payments — `server/modules/payments`

Signed-in: `POST /payments/create-order`, `POST /payments/verify`, `POST /payments/create-link`, `GET /payments/transactions`.

Public: `POST /webhooks/razorpay` (signature checked).

### Meta / Facebook — `server/modules/integrations/meta`

Signed-in connect, pages, forms, campaign mapping, and sync. Several older aliases still work (`/facebook/...`, `/meta/...`, `/auth/meta/connect`).

Public:

- `GET /webhooks/meta` and `GET /webhooks/facebook` — Meta's handshake
- `POST /webhooks/meta` and `POST /webhooks/facebook` — new lead events, HMAC checked
- `GET /integrations/facebook/callback` (also `/auth/meta/callback`, `/facebook/callback`) — OAuth return

`POST /meta/sync` pulls leads from connected forms into the workspace.

### Other inbound leads

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/webhooks/google-ads` | Google Ads lead, webhook key required |
| POST | `/webhooks/lead` | Generic lead ingest |
| POST | `/webhooks/lead/:tenantKey` | Same ingest, tenant taken from the URL |

### Integrations and health

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/integrations/config` | Saved integration config |
| POST | `/integrations/save` | Save a connection |
| POST | `/integrations/disconnect` | Disconnect |
| DELETE | `/integrations/:id` | Remove a connection |
| POST | `/integrations/test` | Test a connection |
| POST | `/integrations/sync` | Run a sync |
| GET | `/facebook/status` | Facebook connection status |
| GET | `/health` and `/api/health` | Process is up. Reports `postgres` or `json` as the store |

## Filtering

There are three layers. They are not the same function.

### 1. Server scope (security)

This is not a UI filter. It drops records the caller is not allowed to see.

- Leads: `multiTenantDb.getLeads` keeps a non-admin's own leads (and a manager's team).
- Reports: `resolveRequestedAgentIds` in `server/utils/accessScope.ts` starts from that scope, then narrows it if the report asked for a `userId` or `managerId`. An admin with both set to `ALL` gets `null`, which means "do not cut by agent".
- `callMatchesAgents` in `server/modules/reports/reports.service.ts` then keeps a call when its `agentId` is in that list, or when the stored agent name matches one of those people.

### 2. Leads page (browser)

`filteredAndSortedLeads` in `src/pages/LeadsPage.tsx` runs on the array already returned by `GET /leads`. A lead must pass every step. Empty filters are skipped.

1. **Search** (`searchTerm` + `searchField`)
   - `phone` — phone or alt phone, including digit-only match once the query has 2+ digits
   - `name` — name contains the text
   - `email` — email contains the text
   - `text` — notes, company, city, address, source, or any custom field
   - `auto` / everything else — any of name, phone, email, company, notes, source, owner, or custom fields
2. **Role** — if the signed-in user is not an admin, `matchesAgent` keeps only their leads
3. **View chip** (`activeFilterId`)
   - `all_leads` — every stage
   - `active_leads` — stage category `active`. If the status does not match a stage, fresh/new and closed/lost/won/junk are dropped
   - `my_leads` — owned by the signed-in user
   - `followup_leads` — status contains "follow", or `followUpAt` is set
4. **Assignee** — `all`, `unassigned` (`isUnassignedOwner`: no owner id, and name blank or "unassigned"), or one agent via `matchesAgent`
5. **Status** — exact status text. If the status is Lost and a lost reason is chosen, `lostReason` must match too
6. **Created date** — `Today`, `Yesterday`, `Last 7 Days`, `This Month`, or `all`. Relative strings like "2 days ago" are parsed before the comparison
7. **Condition builder** — `evaluateLeadAgainstConditions` (next section). Every active condition must match (AND, not OR)

After that, the list is sorted by created date, rating, or name, then sliced for the current page.

`matchesAgent` (`src/utils/agentDisplay.ts`) matches the lead's `ownerAgentId` to the agent id first. If that fails, it compares the live agent name from `resolveAgentName`, so a renamed user still matches.

### 3. Condition builder

File: `src/utils/conditionFilterEngine.ts`. Used by the leads page when chips from `LeadsConditionFilter` / `AddConditionModal` are active.

`evaluateLeadAgainstConditions(lead, conditions, { agents, leadRatings })` returns true when there are no conditions, or when **every** condition matches.

It resolves the lead value from `fieldId` (name, phone, email, company, city, state, status, rating, deal value, source, assignee, created by, lost reason, tags, created date, notes). Anything else is read from `lead.customFields` or the lead object itself. Assignee and created-by values are turned into the current agent name before compare. Comparisons are lowercased and trimmed.

Operators depend on the field type (`DATA_TYPE_OPERATOR_MAPPING`):

| Type | Operators |
| --- | --- |
| text | equals, not equals, begins with, not begins with, contains, not contains, empty, not empty |
| number | equals, not equals, greater / less / greater-or-equal / less-or-equal, empty, not empty |
| phone | equals, begins with, not begins with, empty, not empty. Digits are compared as well as the raw string |
| date | is, is not, empty, not empty. "Is" matches the `YYYY-MM-DD` of the lead date |
| boolean | is true, is false, empty, not empty. True accepts `true`, `1`, `yes` |
| select | in, is not, empty, not empty. `in` matches equal, lead contains value, or value contains lead |
| lost reason, user | is, is not, empty, not empty |

Empty / not-empty on a user field uses `isUnassignedOwner` instead of a blank string.

Dropdown choices for stage, source, lost reason, and assignee come from `getDynamicFieldOptions`, which mixes configured options, current agents, and values already present on leads.

### Other screens (also in the browser)

These do not use the condition engine. Each page filters the list it already has:

| Screen | File | What it filters on |
| --- | --- | --- |
| Pipeline board | `src/pages/PipelinePage.tsx` | Assignee (`all` / `unassigned` / one agent) and a search across name, phone, email, company |
| Campaign leads | `src/pages/CampaignsPage.tsx` | Name or phone search, plus assignee |
| Inbox | `src/pages/OmnichannelInboxPage.tsx` | Name, phone, or company |
| Tasks | `src/pages/TasksPage.tsx` | Title or description |
| Call reports | server, see above | The only list filter that runs in the API, via `GET /reports/call-logs` |

Inside the report builder (`buildCallLogsReport`), a call is kept only if it passes agent scope, the date range, disposition, call type, and the search string. Totals (talk time, sales, hourly chart) use the agent-and-date slice, before search, disposition, and type. Sales are the `dealValue` of leads in that same agent and date window whose status is `converted` or `won`.
