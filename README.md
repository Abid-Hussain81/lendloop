# LendLoop

**Borrow what you need. Lend what you don’t.**

A neighborhood tool-lending board built for the Fluence Full-Stack Developer
take-home assignment. Next.js App Router and TypeScript provide the interface;
Clerk handles authentication; Convex owns application data and authorization;
Docker-hosted n8n runs notifications and overdue reminders.

Notifications are **mock deliveries recorded in Convex** and visible on the
relevant loan. No email, Slack, or Discord messages are sent.

## Quick start

Requirements: Node.js 22+, npm, Docker Desktop with Linux containers, a Clerk
development application, and a Convex development deployment (cloud or local).

```sh
npm ci
```

1. Copy `.env.example` to `.env.local`. Add the Clerk publishable/secret keys.
   These are your own development keys; never commit them.
2. In Clerk, [activate the Convex integration](https://dashboard.clerk.com/apps/setup/convex)
   for the same application as your keys, or enable a JWT template named `convex`
   with audience `convex`.
   Copy the Clerk issuer domain. Follow the current
   [Clerk/Convex integration guide](https://docs.convex.dev/auth/clerk).
3. Run `npx convex dev` and select/create a development deployment. It writes
   `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.
4. Set `CLERK_JWT_ISSUER_DOMAIN` **in the Convex deployment environment**, using
   the dashboard or `npx convex env set`. Keep `convex dev` running; it deploys
   functions and regenerates `convex/_generated/`.
5. Run `npm run dev`, then open <http://localhost:3000>.

If no deployment has been configured, the interface deliberately shows a setup
state. It does not show fabricated listings or pretend sign-in works.

### Administrator bootstrap

Create a user through Clerk and copy its `user_...` ID. Set the Convex environment
variable `ADMIN_CLERK_USER_IDS` to that ID (or comma-separated IDs). Sign in as
that user to see Administration. Only the deployment operator can change this
allowlist. Browser profile metadata and request parameters cannot grant roles.

### Docker-hosted n8n

For local development, generate an ignored environment file:

```sh
node scripts/setup-local-automation.mjs
docker compose -p lendloop-assignment up -d
```

This creates independent random encryption, runner-auth, and directional signing
secrets without printing them. It will not overwrite an existing environment
file. The default Convex HTTP address inside Docker is
`http://host.docker.internal:3211`, appropriate for a local Convex backend. For
Convex Cloud, change `CONVEX_SITE_URL` in `automation/.env` to the deployment's
**`.convex.site` URL**, not its `.convex.cloud` client URL.

Open <http://localhost:5678> and complete n8n's local owner setup. Import the error
workflow first, then the other two, either through the editor or:

```sh
docker compose -p lendloop-assignment exec n8n n8n import:workflow --input=/workflows/errors.json
docker compose -p lendloop-assignment exec n8n n8n import:workflow --input=/workflows/notifications.json
docker compose -p lendloop-assignment exec n8n n8n import:workflow --input=/workflows/overdue.json
```

In the editor, confirm each main workflow uses **LendLoop automation errors** as
its error workflow, and publish/activate the notification and overdue workflows.
The error workflow uses an Error Trigger and does not call itself on failure.
If an import changes a workflow ID, reselect the error workflow in Settings.

Set these additional **Convex deployment** variables:

| Variable | Value |
| --- | --- |
| `CONVEX_TO_N8N_SECRET` | Same directional value as `automation/.env` |
| `N8N_TO_CONVEX_SECRET` | Same reverse-direction value as `automation/.env` |
| `N8N_WEBHOOK_URL` | Reachable production webhook URL ending `/webhook/lendloop-request` |

For local Convex, the webhook can be `http://localhost:5678/webhook/lendloop-request`.
For Convex Cloud, supply a public HTTPS webhook host/tunnel that forwards
**only the webhook path** to local n8n. Set `WEBHOOK_URL` to that HTTPS base and
restart the containers. Do not expose n8n's editor through the tunnel.
The `N8N_WEBHOOK_PATH` value must match the exact externally requested path;
use `/webhook-test/lendloop-request` only while explicitly testing a test webhook.

The Compose editor port binds to loopback. HTTP cookies and environment access
inside Code nodes are intentionally enabled for this dedicated local mock
instance. The external JavaScript runner receives an explicit module allowlist
containing only `crypto` and `url`. Treat workflow editor access as privileged; use HTTPS,
secure cookies, access controls and a dedicated secrets strategy for production.

After changing `automation/scripts/*.js`, regenerate committed workflow exports:

```sh
npm run workflows:generate
```

### Verification

```sh
npm run check
```

This runs strict TypeScript checking and a production build. Use the manual
verification walkthrough below to check the borrowing and automation flows.
Automated test suites are omitted from this submission.

The local notification round trip was verified through Convex dispatch, n8n
signature verification, a signed callback, and a persisted mock receipt.
Approval and return were verified using synthetic local backend identities;
the fixture listing was archived afterward. Signed overdue requests returned
200, replays 409, and unsigned requests 401. The dataset had no overdue loans.
Both main n8n workflows were published locally.

Browser borrowing with two Clerk users, live admin operations, and scheduled
reminder delivery for an overdue loan remain manual checks. Synthetic operator
checks do not validate real Clerk token issuance.

After connecting a deployment, `npx convex dev` or `npm run codegen`
regenerates the typed helpers using the official CLI.
`scripts/generate-offline.mjs` is a development-only bootstrap tied to the pinned
Convex SDK; production/deployment builds should use the supported CLI.

## Architecture

```text
Browser → Clerk session → Convex token validation → authorized queries/mutations
                                  │
Loan changes + outbox event (one transaction)
                                  │
Convex cron → leased delivery action → signed n8n webhook
                                  │
                verify raw bytes → signed callback → idempotent mock receipt

n8n daily schedule → signed overdue request → one item per loan
                                  │
                  signed reminder write-back → idempotent loan/day receipt
```

- `app/` and `components/`: public catalog, authentication, member dashboard,
  tool forms, loan decisions/returns, admin controls and recent activity.
- `convex/tools.ts`, `loans.ts`, `users.ts`: backend rules and public projections.
- `convex/automation.ts`: persistent deduplication, delivery leases, retry state,
  mock receipts, sanitized workflow failures and admin health data.
- `convex/delivery.ts`, `crons.ts`, `http.ts`: signed integration and scheduling.
- `automation/workflows/`: importable, inactive-by-default n8n JSON exports.

### Rules

Dates are inclusive **UTC calendar dates**. Pending requests do not reserve a
tool. Approval checks for overlap against approved, unreturned loans in the same
Convex mutation as the state change; Convex transactions protect this read/write
decision from concurrent conflicting approvals. Only a lender can approve or
decline a pending request. Either participant can mark an approved loan returned.

Removing a listing archives it; existing loans remain readable and returnable.
No new borrowing or approvals are allowed for archived listings. The public query
returns only `name` and `category`; it never serializes owner/user/loan fields.

## Security and data minimization

- All protected functions derive identity from the validated Clerk token.
  Ownership and admin checks run in Convex, independently of the UI.
- Signed-in users access their own incoming/outgoing loans; administrators may
  view all loans and remove listings. Trusted-lender status grants no extra role.
- HMAC-SHA256 covers `timestamp + "." + exactPath + "." + exactBody` in both
  directions. Verification rejects tampering and timestamps outside five minutes.
- Reverse integration requests use random request IDs with persistent replay
  checks. Nonces remain for ten minutes, longer than the accepted signature window.
- Notification receipts deduplicate by event ID; reminders by loan ID and UTC
  day. A retried write-back cannot add a second mock receipt.
- Event payloads contain event ID/type only. Overdue payloads contain loan ID/day
  only. Routing remains in Convex. No emails, names, addresses, or secrets are
  copied into these payloads.
- Exported workflow JSON references environment names, never their secret values.
  Error reports contain only an execution key and workflow category.

### Reliability and limits

The outbox dispatcher runs every minute and atomically leases up to ten due
events. Delivery attempts use exponential backoff and stop after five attempts.
Exhausted deliveries appear in Administration; n8n's error workflow also records
sanitized failure metadata. Missing signing configuration leaves events pending
instead of consuming their retry budget.

Delivery is at least once. A new workflow execution generates a fresh request
nonce, while event/reminder IDs stay stable. If a network response is lost after
a receipt commits, a repeated HTTP node request may receive replay status 409;
rerunning the workflow uses a fresh nonce and sees the idempotent receipt. No
duplicate mock record is created. Failed error-report delivery is itself visible
in n8n execution history, without an infinite recursive error workflow.

These mocks demonstrate reliable, idempotent **records**, not exactly-once email
delivery. A real notifier needs provider-level idempotency, durable delivery
receipts and reconciliation after ambiguous timeouts. Lists/history are intended
for a small assignment dataset; paginate and index richer availability searches
before scaling. Configure retention for receipts and audit history deliberately.

## Production changes

Use managed HTTPS for the app and n8n, secret rotation, authenticated/restricted
n8n administration, rate limits, monitoring and alerts, backups, and a durable
notification provider with idempotency keys. Add multi-user load/concurrency and
failure-injection tests against a real deployment. Add pagination, data retention
and an operator-controlled retry/reconciliation interface. Never claim healthcare
regulatory compliance solely because these technical controls exist.

## Manual verification walkthrough

Use two development users in separate browser profiles and an operator-configured
administrator. Run these checks in your own development deployment:

1. As a visitor, confirm the catalog shows only tool names and categories.
2. As the lender, create and edit a tool listing.
3. As the borrower, request future UTC dates. Approve as the lender.
4. Create a second overlapping request and confirm its approval is rejected.
5. With automation configured and the workflows activated, inspect the n8n
   execution and the loan's mock notification activity after dispatch.
6. Repeat a logical notification using a fresh signed request; confirm it does
   not add another receipt.
7. Mark the approved loan returned as either participant.
8. As admin, inspect all loans, mark a lender trusted, and remove a listing.
   Confirm ordinary users cannot perform those operations.
9. In isolated development data, prepare an approved loan whose end date is
   before today and execute the overdue workflow twice. Confirm one reminder
   per loan/day. Normal borrowing forms correctly reject past start dates;
   use isolated development fixtures for this check.
10. Exercise a development integration failure, inspect retries/error records,
    and restore the configuration.

## Repository contents

The repository includes application source, example environment files,
Docker Compose configuration, and three importable workflow JSON exports.
[SETUP.txt](SETUP.txt) is an additional plain-text setup reference.
Runtime credentials, service state, dependencies, and personal preparation
documents are excluded. This is a local-development deliverable; a hosted demo
is not included.
