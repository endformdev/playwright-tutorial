# Fault Injection Telemetry Plan

This plan defines the next fault-injection work for this Playwright tutorial repository. The goal is not to implement invariant discovery yet. The goal is to build a stronger suite of normal product tests plus opt-in faults that can produce differentiated Playwright, browser, network, server, and data-layer telemetry.

## Goal

Create deterministic failing Playwright runs that are useful for testing generic invariant discovery over test traces.

The fault suite should produce failures where the final Playwright symptom is often late, while the earlier divergence is visible in trace data such as:

- browser page errors
- console messages
- resource loads
- network requests and responses
- redirects
- server actions
- API routes
- database reads and writes
- authentication/session behavior
- product state transitions

## Non-Goals

- Do not implement invariant discovery in this repository yet.
- Do not create a separate fault-only test suite.
- Do not make normal PR or main test runs require special flags.
- Support one named fault per run; single-fault runs are sufficient.
- Do not add many status-code variants unless they create meaningfully different telemetry.
- Do not add flaky or seeded faults until deterministic examples are working well.

## Activation Model

Faults are activated one at a time:

```bash
pnpm playwright test
FAULTS=script-chunk-404 pnpm playwright test tests/change-password.spec.ts
FAULTS=payment-subscription-update-skipped pnpm playwright test tests/plan-upgrade.spec.ts
```

`FAULTS` supports:

- unset or empty: no active fault; the normal suite should pass.
- a single fault name: activate that named fault only.

The implementation should optimize for targeted single-fault runs.

## Test Structure Rules

Tests that participate in fault injection should continue importing the local fixture wrapper:

```ts
import { expect, test } from "./test";
```

Tests that need a fresh user should continue using `testWithNewUser`, which extends the same base fixture.

The test bodies should remain product journeys. Fault behavior belongs in:

```text
tests/test.ts
tests/support/faults.ts
lib/faults.ts
app routes / server actions only when server-side behavior is required
```

Every participating test must pass normally when `FAULTS` is unset.

## Fault Design Principles

- One fault name should represent one clear abnormal behavior.
- Faults should be deterministic unless the fault name explicitly describes a flaky scenario.
- Prefer real product journeys over synthetic pages.
- Prefer Playwright-layer faults when they produce enough telemetry.
- Add app-level fault gates only when the divergence must occur in server-side code or data state.
- The earliest abnormal event should usually be different from the final Playwright assertion failure.
- Fault names should describe the behavior, not the implementation mechanism.
- Avoid stacking multiple faults on one test target.

## Invariant Coverage Targets

The fault suite should intentionally cover these generic invariant shapes:

| Invariant Shape | Desired Fault Examples |
| --- | --- |
| presence | expected request, log, DB write, resource, or UI event is missing |
| count range | duplicate payment/member/activity/retry, missing row, extra row |
| numeric range | latency spike, timeout, unusually long server action |
| attribute distribution | status code, role, amount, plan, action type, redirect target changes |
| edge existence | action succeeds but related DB write, redirect, refetch, or log is missing |
| edge count range | one action creates too many related rows or requests |
| relative order | activity entries or request/action sequence appears in wrong order |
| conditional eventuality | after trigger A, expected B does not appear within the learned window |

## Fault Categories

Use both product-level and infrastructure-level faults. The invariant system should eventually learn across both without needing domain-specific rules.

### Infrastructure Faults

Infrastructure faults simulate conditions around the app rather than business logic defects.

Useful telemetry surfaces:

- resource request failures
- hydration failures
- browser exceptions
- network latency
- auth middleware redirects
- session cookie mutation
- server-render latency
- API contract breakage

### Product/Data Faults

Product faults simulate incorrect application behavior or inconsistent side effects.

Useful telemetry surfaces:

- server action completion
- DB rows inserted, skipped, duplicated, or updated incorrectly
- activity log side effects
- payment side effects
- invitation/member relationships
- user/session state transitions

## Existing Faults

| Fault | Keep? | Notes |
| --- | --- | --- |
| `api-team-500` | Yes | Good simple HTTP status and API response-distribution example. |
| `api-team-malformed-json` | Maybe | Useful parser/client contract example, but overlaps with API failure unless page errors are captured. |
| `script-404` | Replace or refine | Prefer `script-chunk-404` targeted at a deterministic app script/chunk. |
| `unexpected-dashboard-redirect` | Replace | Prefer auth/session faults that produce the redirect through real middleware behavior. |
| `activity-missing-create-team` | Yes | Good presence/count failure on server-rendered product data. |
| `payment-server-error` | Yes | Good backend exception example, but less valuable than partial side-effect faults. |
| `invite-accepted-but-member-missing` | Yes | Strong edge-existence example: invite acceptance without membership relation. |

## Priority Fault Backlog

### 1. `script-chunk-404`

Target test: `tests/change-password.spec.ts` or `tests/plan-upgrade.spec.ts`

Layer: infrastructure/frontend resource

Method:

- In `tests/support/faults.ts`, intercept one deterministic script request.
- Return HTTP 404 with `x-fault-injected: script-chunk-404`.
- Avoid intercepting every script if possible, because broad interception can obscure the useful failure point.

Expected telemetry:

- resource response with status 404
- possible hydration failure
- possible console/page error
- later interaction failure or timeout

Expected final failure:

- button/link interaction cannot complete, or final URL/UI assertion times out.

Invariant coverage:

- presence
- attribute distribution
- conditional eventuality

### 2. `script-chunk-timeout`

Target test: `tests/activity-section.spec.ts` or `tests/plan-upgrade.spec.ts`

Layer: infrastructure/frontend resource timing

Method:

- Intercept one deterministic script request.
- Delay long enough that hydration or interaction-dependent behavior exceeds the relevant Playwright expectation timeout.
- Prefer a bounded delay over an indefinitely hanging route so the test remains debuggable.

Expected telemetry:

- script request duration outside normal numeric range
- delayed or absent hydration-dependent actions
- final selector or navigation timeout

Expected final failure:

- navigation click, form submission, or hydrated control interaction fails.

Invariant coverage:

- numeric range
- conditional eventuality
- order

### 3. `runtime-error-after-hydration`

Target test: any dashboard journey, preferably `tests/activity-section.spec.ts`

Layer: infrastructure/browser runtime

Method:

- Inject a browser-side script after initial page load that throws an error.
- The test should still proceed until a normal product assertion fails.
- Do not add hidden fixture assertions for the page error.

Expected telemetry:

- `pageerror` event
- console/error event
- later product assertion failure

Expected final failure:

- a normal UI assertion fails after the page error.

Invariant coverage:

- presence
- order
- conditional eventuality

### 4. `api-team-latency-spike`

Target test: `tests/change-name.spec.ts`

Layer: infrastructure/network timing

Method:

- Intercept `**/api/team`.
- Delay before continuing or fulfilling.
- Keep status/body otherwise normal if possible.

Expected telemetry:

- `/api/team` duration outside learned range
- normal account-update success occurs earlier
- team-member UI never refreshes before timeout

Expected final failure:

- `John Doe` team-member assertion times out.

Invariant coverage:

- numeric range
- conditional eventuality

### 5. `api-user-malformed-json`

Target test: `tests/change-email.spec.ts`

Layer: infrastructure/API contract

Method:

- Intercept or app-gate `/api/user` to return HTTP 200 with invalid JSON.
- Use this where `/api/user` feeds visible user state, such as the general settings form or user menu.

Expected telemetry:

- successful HTTP status with invalid response body
- client parse exception
- missing user-dependent UI state

Expected final failure:

- expected email input value or authenticated UI assertion fails.

Invariant coverage:

- attribute distribution
- presence
- conditional eventuality

### 6. `session-cookie-invalid-on-dashboard`

Target test: `tests/activity-section.spec.ts`

Layer: infrastructure/auth/session

Method:

- Before visiting `/dashboard`, overwrite the `session` cookie with an invalid value.
- Let `proxy.ts` and normal auth/session code handle the result.

Expected telemetry:

- invalid JWT verification path
- session cookie deletion or replacement
- redirect to `/sign-in`
- missing dashboard route/page events

Expected final failure:

- dashboard URL or `Team Settings` heading assertion fails.

Invariant coverage:

- attribute distribution
- edge existence
- conditional eventuality

### 7. `session-cookie-missing-mid-flow`

Target test: `tests/plan-upgrade.spec.ts` or `tests/change-password.spec.ts`

Layer: infrastructure/auth/session

Method:

- Allow the initial authenticated page to load.
- Clear the `session` cookie before an authenticated server action.
- The product action should fail through normal auth behavior.

Expected telemetry:

- initial authenticated route succeeds
- later server action/API has unauthenticated behavior
- redirect, thrown action error, or missing success side effect

Expected final failure:

- payment success, password success, or dashboard assertion fails.

Invariant coverage:

- order
- conditional eventuality
- edge existence

### 8. `account-update-db-write-skipped`

Target test: `tests/change-name.spec.ts`

Layer: product/data side effect

Method:

- Add an app-level fault gate in `updateAccount`.
- Return the normal success state and still log activity if desired.
- Skip the `users` row update.

Expected telemetry:

- server action completes successfully
- activity log may exist
- `/api/team` and `/api/user` still expose old user data

Expected final failure:

- `John Doe` does not appear in the team member list.

Invariant coverage:

- edge existence
- conditional eventuality

### 9. `password-hash-update-skipped`

Target test: `tests/change-password.spec.ts`

Layer: product/data side effect

Method:

- Add an app-level fault gate in `updatePassword`.
- Return `Password updated successfully.` but skip updating `users.passwordHash`.
- Optionally still write the `UPDATE_PASSWORD` activity log to create a stronger partial-side-effect trace.

Expected telemetry:

- update action returns success
- password hash DB update missing
- sign-out succeeds
- sign-in with new password fails

Expected final failure:

- final dashboard URL or heading assertion after re-login fails.

Invariant coverage:

- edge existence
- conditional eventuality

### 10. `payment-subscription-update-skipped`

Target test: `tests/plan-upgrade.spec.ts`

Layer: product/data side effect

Method:

- In `processPayment`, insert the payment row.
- Skip the `teams` subscription update.
- Still redirect to `/dashboard?payment=success`.

Expected telemetry:

- payment insert exists
- subscription update missing
- success redirect occurs
- dashboard refetch shows Free plan

Expected final failure:

- dashboard still shows `Current Plan: Free` or lacks `Billed monthly`.

Invariant coverage:

- edge existence
- attribute distribution
- conditional eventuality

### 11. `invite-role-drift`

Target test: `tests/team-invitation.spec.ts`

Layer: product/data attribute drift

Method:

- During invited signup, insert the team member with a role different from the invitation role.
- Keep signup and membership creation otherwise successful.

Expected telemetry:

- invitation accepted
- team member relationship exists
- role attribute differs from normal distribution

Expected final failure:

- expected `member` role assertion fails.

Invariant coverage:

- attribute distribution
- edge existence

## New Normal Tests To Add

These tests should be added as normal passing product journeys before attaching faults.

### `tests/activity-after-account-update.spec.ts`

Normal journey:

- create fresh user
- navigate to general settings
- update account name
- navigate to activity page
- assert `You updated your account` appears

Faults enabled later:

- `activity-update-log-missing`
- `activity-update-log-mislabelled`

Why this test matters:

- Creates a clean action-to-activity conditional eventuality.
- Gives the invariant miner an expected server action to DB activity edge.

### `tests/activity-order.spec.ts`

Normal journey:

- create fresh user
- perform two visible actions, such as account update then password update
- navigate to activity page
- assert the newest expected activity appears before the older expected activity

Faults enabled later:

- `activity-order-inverted`
- `activity-timestamp-drift`

Why this test matters:

- Produces relative-order coverage.
- Produces timestamp/order telemetry without relying only on final selector absence.

### `tests/payment-history.spec.ts`

Normal journey:

- create fresh user
- complete Plus checkout
- call authenticated `/api/payment` from the page context or add UI if needed
- assert exactly one payment row for the current team with amount `1200`, currency `USD`, and plan `Plus`

Faults enabled later:

- `payment-duplicate-charge`
- `payment-wrong-amount`
- `payment-row-missing`

Why this test matters:

- Produces count-range and attribute-distribution coverage.
- Differentiates successful redirect from correct persisted payment state.

### `tests/signout-session.spec.ts`

Normal journey:

- create fresh user
- visit dashboard
- sign out from the user menu
- assert signed-out home/header state
- navigate directly to `/dashboard`
- assert redirect to `/sign-in`

Faults enabled later:

- `signout-cookie-not-cleared`
- `signout-activity-log-missing`

Why this test matters:

- Produces auth/session and redirect telemetry through a normal product journey.

### `tests/duplicate-invite.spec.ts`

Normal journey:

- create fresh user
- invite an email
- invite the same email again
- assert duplicate invitation is rejected with the existing product error

Faults enabled later:

- `duplicate-pending-invite-allowed`

Why this test matters:

- Produces uniqueness/count coverage around invitations.

## Second-Wave Faults

Implement after the priority backlog and new normal tests are stable.

| Fault | Test | Layer | Expected Divergence |
| --- | --- | --- | --- |
| `activity-update-log-missing` | `activity-after-account-update.spec.ts` | product/data | account update succeeds but `UPDATE_ACCOUNT` activity row is missing |
| `activity-update-log-mislabelled` | `activity-after-account-update.spec.ts` | product/data | activity row exists with wrong action attribute |
| `activity-order-inverted` | `activity-order.spec.ts` | product/data | activity timestamps/order are reversed |
| `activity-timestamp-drift` | `activity-order.spec.ts` | product/data | one activity timestamp is outside normal relative timing |
| `payment-duplicate-charge` | `payment-history.spec.ts` | product/data | one checkout creates two payment rows |
| `payment-wrong-amount` | `payment-history.spec.ts` | product/data | payment row has unexpected amount or plan |
| `payment-row-missing` | `payment-history.spec.ts` | product/data | subscription update succeeds but payment row is absent |
| `signout-cookie-not-cleared` | `signout-session.spec.ts` | product/session | sign-out action runs but session remains valid |
| `signout-activity-log-missing` | `signout-session.spec.ts` | product/data | sign-out succeeds but activity log is missing |
| `duplicate-pending-invite-allowed` | `duplicate-invite.spec.ts` | product/data | second identical pending invitation is created |

## Implementation Steps

### Step 1: Simplify Fault Activation Semantics

- Keep `FAULTS` as a single fault-name string.
- Do not add multi-fault activation unless a concrete need appears.
- Update `tests/support/faults.ts` so each implemented fault only activates for its intended test title.
- Keep app-level `isFaultActive(faultName)` as exact single-name matching unless there is a concrete need to change it.

### Step 2: Refine Existing Infrastructure Faults

- Replace broad `script-404` behavior with targeted `script-chunk-404`.
- Add `script-chunk-timeout`.
- Add `runtime-error-after-hydration`.
- Verify these produce resource/page-error telemetry before the final assertion failure.

### Step 3: Add Auth/Session Infrastructure Faults

- Add `session-cookie-invalid-on-dashboard` in the Playwright fixture layer.
- Add `session-cookie-missing-mid-flow` with targeted installation for one journey.
- Prefer real middleware/auth behavior over synthetic redirect fulfillment.
- Replace or de-emphasize `unexpected-dashboard-redirect`.

### Step 4: Add Product/Data Side-Effect Faults To Existing Tests

- Add `account-update-db-write-skipped` in `updateAccount`.
- Add `password-hash-update-skipped` in `updatePassword`.
- Add `payment-subscription-update-skipped` in `processPayment`.
- Add `invite-role-drift` in invitation signup/member insertion.

### Step 5: Add New Normal Product Tests

- Add `activity-after-account-update.spec.ts`.
- Add `activity-order.spec.ts` if ordering can be asserted reliably.
- Add `payment-history.spec.ts` if payment rows can be queried in a test-scoped way.
- Add `signout-session.spec.ts`.
- Add `duplicate-invite.spec.ts`.

Each test should pass without faults before any fault is attached.

### Step 6: Add Second-Wave Faults To New Tests

- Add activity log missing/mislabelled/order/timestamp faults.
- Add payment duplicate/wrong-amount/missing-row faults.
- Add sign-out cookie/activity faults.
- Add duplicate-invite acceptance fault.

### Step 7: Verification Commands

Normal suite:

```bash
pnpm playwright test
```

Representative single-fault runs:

```bash
FAULTS=script-chunk-404 pnpm playwright test tests/change-password.spec.ts
FAULTS=session-cookie-invalid-on-dashboard pnpm playwright test tests/activity-section.spec.ts
FAULTS=account-update-db-write-skipped pnpm playwright test tests/change-name.spec.ts
FAULTS=password-hash-update-skipped pnpm playwright test tests/change-password.spec.ts
FAULTS=payment-subscription-update-skipped pnpm playwright test tests/plan-upgrade.spec.ts
FAULTS=invite-role-drift pnpm playwright test tests/team-invitation.spec.ts
```

Later new-test fault runs:

```bash
FAULTS=activity-update-log-missing pnpm playwright test tests/activity-after-account-update.spec.ts
FAULTS=activity-order-inverted pnpm playwright test tests/activity-order.spec.ts
FAULTS=payment-duplicate-charge pnpm playwright test tests/payment-history.spec.ts
FAULTS=signout-cookie-not-cleared pnpm playwright test tests/signout-session.spec.ts
FAULTS=duplicate-pending-invite-allowed pnpm playwright test tests/duplicate-invite.spec.ts
```

## Success Criteria

- `pnpm playwright test` passes with `FAULTS` unset.
- Each priority fault can be run by name and fails deterministically.
- Each fault has a distinct earliest abnormal telemetry event.
- The final Playwright failure remains a normal product assertion, not a hidden fixture assertion.
- The suite covers infrastructure failures, product data failures, and partial side-effect failures.
- The suite provides examples for presence, count range, numeric range, attribute distribution, edge existence, edge count range, order, and conditional eventuality invariants.

## Initial Implementation Order

Recommended order:

1. `script-chunk-404`
2. `api-team-latency-spike`
3. `session-cookie-invalid-on-dashboard`
4. `account-update-db-write-skipped`
5. `payment-subscription-update-skipped`
6. `password-hash-update-skipped`
7. `invite-role-drift`
8. `activity-after-account-update.spec.ts`
9. `payment-history.spec.ts`
10. second-wave activity/payment/signout faults

This order gets differentiated infrastructure and product failures quickly while avoiding new test creation until the existing fault harness has proven stable.
