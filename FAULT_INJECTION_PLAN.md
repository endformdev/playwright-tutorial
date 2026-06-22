# Fault Injection Plan

This repository can produce intentionally failing Playwright runs without keeping a separate fault-only test suite.

Fault injection is an opt-in modification to normal tests. Every test that contains a fault injection point must still be a real product test that passes when `FAULTS` is unset.

## Activation

```bash
pnpm playwright test
FAULTS=api-team-500 pnpm playwright test
FAULTS=all pnpm playwright test
```

`FAULTS` supports:

- unset or empty: no faults are active and the normal suite should pass.
- a fault name, for example `api-team-500`: activate only that named fault.
- `all`: activate every implemented named fault at the same time.

There are no fault categories for now.

## Test Structure

Product journey tests that participate in fault injection should use the local fault-aware fixture wrapper:

```ts
import { expect, test } from "./test";
```

The stage-1 setup and smoke-check tests can keep importing directly from `@playwright/test`; they are intentionally outside the fault fixture to keep the early tutorial setup simple. Tests with a fresh user should extend the same base fixture through `testWithNewUser`.

The test bodies should stay focused on product behavior. Fault installation belongs in the fixture layer:

```text
tests/test.ts
tests/support/faults.ts
```

When `FAULTS` is unset, the fixture is a no-op and the tests run normally. When the requested fault is active, the fixture installs the injected behavior before the test body runs. The test should then fail through its normal product assertions, not through hidden fixture assertions.

Fault-related code should stay neutral and generic:

```text
tests/test.ts
FAULTS=api-team-500
FAULTS=all
```

Do not create separate `*.fault.spec.ts` files for cases that only exist to fail. If a new scenario is needed for fault coverage, add it as a normal passing test first, then map an optional fixture-installed fault to that test.

## Implementation Rules

- Faults must be opt-in and deterministic unless the fault name explicitly describes a flaky case.
- Normal PR and main runs must not require special flags to pass.
- One named fault should represent one clear abnormal behavior.
- Prefer existing user journeys over synthetic pages so failures resemble real test failures.
- Prefer Playwright-layer faults first because they are safest to store in `main`.
- Add app-level fault gates only when the failure must happen on the server side.
- `FAULTS=all` should activate all implemented fault injection points in the normal suite, even if that produces multiple failures in one run.
- When possible, make the early abnormal event different from the final assertion failure.

## Current Faults

| Fault | Normal Test | Method | Expected Failure Shape |
| --- | --- | --- | --- |
| `api-team-500` | `tests/change-name.spec.ts` / name change flow | Fixture intercepts `**/api/team` with `page.route()` and returns HTTP 500. | The account update succeeds, but the team members data cannot refresh, so the normal `John Doe` team-member assertion fails. |
| `script-404` | `tests/change-password.spec.ts` / password change flow | Fixture intercepts script requests with `page.route()` and returns HTTP 404. | Server-rendered page may appear, but JavaScript-dependent interaction fails later in the normal password-change journey. |
| `unexpected-dashboard-redirect` | `tests/activity-section.spec.ts` / activity navigation flow | Fixture intercepts document navigation to `/dashboard` and returns a 302 redirect to `/sign-in`. | The activity test starts with dashboard navigation, but the route unexpectedly lands on sign-in before dashboard assertions. |

Run one current fault with:

```bash
FAULTS=api-team-500 pnpm playwright test tests/change-name.spec.ts
```

Run all current faults together with:

```bash
FAULTS=all pnpm playwright test
```

## Planned Faults

| Fault | Candidate Normal Test | Method | Expected Failure Shape |
| --- | --- | --- | --- |
| `api-team-latency` | `activity-section` or `change-name` | Intercept `**/api/team` and delay beyond the test expectation timeout. | Dashboard shell appears, team-specific content times out. |
| `api-team-malformed-json` | `change-name` | Intercept `**/api/team` with HTTP 200 and invalid JSON. | Client fetch/parsing error appears before team UI assertions fail. |
| `api-user-null` | `change-email` | Intercept `**/api/user` with JSON `null`. | User-dependent UI behaves as signed out while authenticated UI is expected. |
| `api-user-500` | `change-password` or `change-email` | Intercept `**/api/user` with HTTP 500. | User-dependent UI fails after an earlier API 500. |
| `session-cookie-invalid` | `activity-section` | Overwrite the `session` cookie with an invalid value before visiting `/dashboard`. | Protected route redirects or user APIs fail auth checks. |
| `session-cookie-missing-mid-flow` | `change-password` or `plan-upgrade` | Clear the `session` cookie after initial page load, then perform an authenticated action. | Initial page looks normal, later server action/API call fails. |
| `script-timeout` | `activity-section` or `plan-upgrade` | Intercept one JS resource and never fulfill until timeout. | Page load or hydration stalls before selectors become available. |
| `stylesheet-404` | `activity-section` | Intercept one stylesheet request and return HTTP 404. | Page may function but visual/resource failure is visible in network output. |
| `page-runtime-error` | Any existing journey | Inject a browser-side thrown error after page load. | `pageerror` occurs before the final assertion failure. |
| `activity-missing-create-team` | `activity-section` | Alter the activity page/data path so `You created a new team` is absent. | Activity page loads, expected historical activity is missing. |
| `activity-empty` | `activity-section` | Make the activity page render the empty state for a user that should have activity. | Activity list count/presence expectations fail. |
| `payment-server-error` | `plan-upgrade` | Make checkout submission hit a deterministic server/action error path. | Payment form submits, dashboard success redirect never occurs. |
| `payment-timeout` | `plan-upgrade` | Delay checkout submission/navigation until the final payment success assertion times out. | Payment action duration is abnormal before final URL assertion fails. |
| `payment-partial-update` | `plan-upgrade` | App-level gate: insert payment but skip team subscription update. | Payment side effect exists, but dashboard still shows Free plan. |
| `invite-response-missing-id` | `team-invitation` | Make invitation action appear successful without emitting an invitation id. | Invitation success text appears, later signup cannot use invite id. |
| `invite-accepted-but-member-missing` | `team-invitation` | App-level gate: accept invitation but skip team member insertion. | Signup appears to complete, team member list is missing the invitee. |
| `duplicate-team-members` | `team-invitation` or `change-name` | Intercept `/api/team` with duplicate team member rows. | Count/range or uniqueness expectations fail. |
| `team-member-role-drift` | `team-invitation` | Intercept `/api/team` so a member role changes unexpectedly. | Role text assertion fails after valid team response with unexpected attributes. |
| `seeded-flake-api-team` | `activity-section` or `change-name` | Use a deterministic seeded check to sometimes return `/api/team` 500. | Repeated runs produce a controlled pass/fail mix. |
| `seeded-flake-slow-payment` | `plan-upgrade` | Use a deterministic seeded check to sometimes delay payment submission. | Repeated payment runs produce controlled timing flake data. |
