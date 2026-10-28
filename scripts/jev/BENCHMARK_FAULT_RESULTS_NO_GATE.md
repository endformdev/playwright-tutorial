# Jev fault-injection results: no execution gate

## September 28, 2026

All **30 implemented fault injectors** were run against their configured scenarios using the no-gate controller (`f2858ef`; branch HEAD at run time `6ee75a1`). The controller and verifiers were not modified for this experiment. Clean reference: [no-gate benchmark](BENCHMARK_RESULTS_NO_GATE.md), **72/150 verified successes**.

**Retained outcomes: 3 verified successes, 19 model stops, 6 repeated-state stalls, 1 step-limit exit, and 1 initialization timeout. No completion claim was rejected by the existing verifier.**

The three passes preserved the outcomes actually checked: the extra background request, database delay, and missing sign-out activity-log entry. The last is a coverage gap if activity logging is part of the desired contract. The remaining non-passes must not be presented as 27 detected defects: several workflows already fail cleanly, some never reached the injected behavior, and the timeout happened before model execution.

### Method

- One retained attempt per fault, mapped to its existing scenario; 30 unique faults checked against `implementedFaults` and the scenario mappings.
- Initial matrix concurrency three; fresh user and live browser session per attempt. The three infrastructure retries ran sequentially with the same controller and harness.
- No separate execution gate or action-confidence threshold. Completion threshold 0.90; maximum 30 iterations; seven-minute loop deadline; five-entry history; existing repetition guard.
- Existing fault installers, input values, action context, and independent Playwright assertions retained.
- Jev API interruptions are excluded and rerun; none occurred in this matrix.
- Three Endform/artifact interruptions were rerun once. Original attempts remain available, but the table uses their replacements. The script-delay initialization timeout was retained because it occurred under the targeted delay injection, not treated as a model-service interruption.
- This is a one-attempt-per-fault exploratory matrix, not a repeated estimate of detection probability.

Initial command:

```sh
bun scripts/jev-benchmark.ts --mode faults --concurrency 3 --output benchmark-results/no-gate-full-fault-matrix
```

The retry launcher used an unchanged copy of the benchmark controller with only the task list filtered to `unexpected-dashboard-redirect`, `session-cookie-invalid-on-dashboard`, and `invite-accepted-but-member-missing`. It ran with concurrency one and was removed afterward. The retained manifest records which original attempts were replaced.

### All 30 outcomes

“Clean” is the corresponding no-gate scenario’s verified count out of ten. Evidence below comes from saved decisions/snapshots and injector source inspection. It describes observed effects, not an independent assertion that every fault activated.

| Fault | Scenario | Clean | Outcome | Steps | Time | Observed behavior / limitation |
|---|---|---:|---|---:|---:|---|
| activity-update-log-missing | activity-after-account-update | 10/10 | Model stopped | 12 | 33.2s | Reached Activity; account-update entry absent; signup and team-creation entries remained. |
| activity-update-log-mislabelled | activity-after-account-update | 10/10 | Model stopped | 7 | 24.2s | Reached Activity; a password-change entry appeared in place of the account update. |
| activity-order-inverted | activity-order | 0/10 | Model stopped | 9 | 26.2s | Stopped on Security after changing password; never opened Activity, so reversed ordering was not inspected. |
| runtime-error-after-hydration | activity-section | 10/10 | Model stopped | 3 | 13.5s | Final dashboard accessibility tree was empty. |
| unexpected-dashboard-redirect | activity-section | 10/10 | Model stopped | 3 | 14.8s | Retry started on sign-in and ended on signup; never reached Activity. |
| session-cookie-invalid-on-dashboard | activity-section | 10/10 | Model stopped | 3 | 14.1s | Retry started on sign-in and ended on signup; no authenticated Activity page. |
| activity-missing-create-team | activity-section | 10/10 | Model stopped | 3 | 15.9s | Activity showed signup but no team-creation entry. |
| api-user-malformed-json | change-email | 0/10 | Model stopped | 14 | 34.5s | Reached General after update and login actions, then stopped at 0.63 completion confidence; clean scenario also fails. |
| api-team-500 | change-name | 10/10 | Model stopped | 5 | 18.4s | Returned to Team Settings showing No team members yet. |
| api-team-extra-request | change-name | 10/10 | Verified success | 5 | 19.8s | Updated name verified, including reload; background request count is outside verification. |
| api-team-db-latency-spike | change-name | 10/10 | Verified success | 5 | 19.4s | Updated name verified, including reload; database latency is outside verification. |
| api-team-db-read-skipped | change-name | 10/10 | Model stopped | 5 | 17.6s | Returned to Team Settings showing No team members yet. |
| api-team-latency-spike | change-name | 10/10 | Model stopped | 5 | 17.4s | Stopped on Team Settings before observing John Doe; delayed data is not evidence of a persistent functional failure. |
| api-team-malformed-json | change-name | 10/10 | Model stopped | 5 | 16.8s | Returned to Team Settings with the old email displayed instead of John Doe. |
| account-update-db-write-skipped | change-name | 10/10 | Model stopped | 6 | 19.7s | Returned to Team Settings with the old email rather than the new name. |
| script-404 | change-password | 0/10 | Model stopped | 27 | 56.1s | Still traversed the password workflow; later repeated mutations ended with Current password is incorrect. Script failure was not separately instrumented. |
| script-chunk-404 | change-password | 0/10 | Model stopped | 27 | 56.9s | Still traversed the password workflow; later repeated mutations ended with Current password is incorrect. Script failure was not separately instrumented. |
| password-hash-update-skipped | change-password | 0/10 | Model stopped | 30 | 61.6s | New-password login failed; old-password login worked; another update/login cycle ended with Invalid email or password. |
| duplicate-pending-invite-allowed | duplicate-invite | 6/10 | Stall | 13 | 34.1s | Repeated the invitation with the supplied email; Invitation sent successfully remained, with no expected duplicate warning. |
| payment-duplicate-charge | payment-history | 0/10 | Stall | 11 | 29.6s | Stopped at incomplete checkout; required cardholder/billing values absent. Payment-side mutation not demonstrated. |
| payment-wrong-amount | payment-history | 0/10 | Stall | 11 | 31.3s | Stopped at incomplete checkout; required cardholder/billing values absent. Payment-side mutation not demonstrated. |
| payment-row-missing | payment-history | 0/10 | Model stopped | 7 | 24.5s | Stopped at an unfilled checkout form; payment write was not demonstrated. |
| script-chunk-timeout | plan-upgrade | 0/10 | Initialization timeout | 0 | 24.6s | Initial page.goto timed out after 15 seconds waiting for load; zero model requests. |
| session-cookie-missing-mid-flow | plan-upgrade | 0/10 | Stall | 11 | 29.4s | Reached checkout but left required fields empty; cookie deletion was not independently checked. |
| payment-server-error | plan-upgrade | 0/10 | Stall | 13 | 33.8s | Clicked purchase with missing required cardholder/billing fields; no injected server-error response observed. |
| payment-subscription-update-skipped | plan-upgrade | 0/10 | Stall | 11 | 28.8s | Stopped at incomplete checkout; subscription-write path not demonstrated. |
| signout-cookie-not-cleared | signout-session | 6/10 | Model stopped | 7 | 20.5s | After sign-out and dashboard navigation, Team Settings remained accessible; model stopped. |
| signout-activity-log-missing | signout-session | 6/10 | Verified success | 4 | 17.8s | Sign-out and protected-route redirect verified; activity log is not part of this verifier. |
| invite-accepted-but-member-missing | team-invitation | 4/10 | Step limit | 30 | 64.8s | Retry reached Team Settings with No team members yet after invite signup; repeated invitations/signup attempts until the step limit. |
| invite-role-drift | team-invitation | 4/10 | Model stopped | 10 | 25.3s | Reached Team Settings with the invited email shown as owner rather than member; stopped at 0.14. |

### What these outcomes establish

**Eighteen faults now map to scenarios with at least some clean success.** Of those, three passed, thirteen ended in model stops, one stalled, and one hit the step limit. This includes duplicate invitations (6/10 clean), sign-out (6/10), and team invitation (4/10), whose fault runs previously had little interpretive value when their clean counterparts never passed. These clean rates are still imperfect, so a single non-pass is not proof of sensitivity.

**Several visible effects were reached.** Missing/mislabelled activity entries, absent team members, the wrong invitation role, repeated invitation success instead of duplicate rejection, and continued authenticated dashboard access after sign-out all appear in the saved observations. These runs did not produce verified success. That is useful evidence of refusing a pass in the presence of a wrong visible outcome, but the controller usually reports a generic stop or stall rather than diagnosing the injected defect.

**The password-write fault produced a particularly useful trace despite its 0/10 clean baseline.** Login with the new password failed, login with the old password succeeded, and a second cycle again failed with the new password. This is consistent with the skipped-write injection and demonstrates that the login behavior was exercised. Because the clean controller already fails the scenario, the final model stop still cannot establish a detection rate.

**Twelve faults map to scenarios with zero clean successes.** These are activity ordering, email change, password change, payment history, and plan upgrade. Their non-passes do not establish fault sensitivity. Activity ordering never reached Activity in this fault run. The payment cases remained at forms missing required cardholder/billing values; placeholders were present, but filled values were absent. Clicking the purchase button under those conditions does not prove that server-side payment logic ran.

**The latency and background-work cases require care.** Extra-request and database-delay injections passed because the existing verifier checks the name, not telemetry. The separate seven-second team-API delay stopped before observing the new name; that is controller intolerance of the observed timing, not proof of a permanently incorrect application result. The saved accessibility traces do not independently confirm extra-request counts or database timing.

**The new sign-out pass exposes a verification boundary.** `signout-activity-log-missing` passed because the session cleared and revisiting the dashboard redirected to sign-in. Neither the aim’s implemented checks nor the verifier inspects the sign-out activity entry. It is a pass under the current contract, not evidence that the injected logging fault was detected or absent.

**No verifier rejection occurred.** The three completion claims all passed their existing checks. Consequently this run does not demonstrate the verifier catching a false completion, and its current historical-transition/coverage limitations remain.

### Initialization failure and infrastructure retries

`script-chunk-timeout` delayed a script for 15 seconds; initial dashboard navigation timed out waiting for `load` after 15 seconds, before any model call. This is a browser/harness initialization outcome under injection.

| Retried fault | Original interruption | Retained retry |
|---|---|---|
| unexpected-dashboard-redirect | Endform live session had already ended during the run | Model stopped after 3 steps |
| session-cookie-invalid-on-dashboard | Endform observer WebSocket reset during startup | Model stopped after 3 steps |
| invite-accepted-but-member-missing | Missing `25-after.png` while copying an observation artifact | Step limit after 30 steps |

All three original attempts remain in the initial matrix artifacts. The retry policy addresses infrastructure-interrupted conclusions; it does not turn the retried faults into multiple independent samples or prove those interruptions were unrelated to the injected app behavior.

### Cost and duration

The 30 retained attempts consumed **1,645,474 input tokens** and **84,938 output tokens**, estimated at **$0.069110**. Mean duration was **28.2s**; summed duration was **844.5s**. Summed duration is not wall-clock duration. Including all three superseded infrastructure attempts, the 33 physical attempts cost an estimated **$0.073259** in total.

These use the unchanged benchmark pricing assumption of $0.042 per million input tokens and free output tokens, recorded September 22, 2026. Estimates exclude Endform/browser infrastructure.

### Historical comparison

| Outcome | September 22 gated matrix | September 28 no-gate retained matrix |
|---|---:|---:|
| Verified success | 2 | 3 |
| Model stopped | 16 | 19 |
| Repeated-state stall | 11 | 6 |
| Step limit | 0 | 1 |
| Initialization failure | 1 | 1 |
| False completion rejected by verifier | 0 | 0 |

The added pass is `signout-activity-log-missing`. This comparison is historical, not a pure gate ablation: action descriptions also changed after September 22, and the default `jev-latest` alias is not a pinned model revision. The newer clean contextual-gated benchmark did not include a fault rerun.

### Artifacts

- Canonical retained matrix: `benchmark-results/no-gate-fault-matrix-retained/results.json` and `runs/` (includes replacement provenance).
- Initial 30 physical attempts: `benchmark-results/no-gate-full-fault-matrix/`.
- Three targeted infrastructure retries: `benchmark-results/no-gate-fault-infrastructure-retries/`.
- Clean comparator: `benchmark-results/no-gate-full-clean-10x/` and [BENCHMARK_RESULTS_NO_GATE.md](BENCHMARK_RESULTS_NO_GATE.md).

Each run record references its Endform directory with snapshots, decisions, and screenshots. These machine-local artifacts remain ignored by Git; this report is a new committed file. The existing clean benchmark reports remain unchanged.
