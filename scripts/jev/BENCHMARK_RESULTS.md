# Jev Playwright benchmark results

Measured September 22, 2026 on branch `oliver/jev-test-loop` against the hosted Playwright tutorial application.

## Method

All 15 tests returned by `playwright test --list` were converted to frozen aims and run ten times each. Setup and teardown tests were adapted to isolated accounts. Each attempt used a fresh user, an Endform live-test session, AI-mode accessibility snapshots, screenshots after each step, and these fixed thresholds:

- Jev completion probability: 0.90
- Jev execution-gate probability: 0.80
- Maximum steps: 30
- Loop deadline after startup: 7 minutes

Independent Playwright code verified every completion claim. Timings include Endform startup, screenshots, decisions, verification, and cleanup. Three attempts ran concurrently. Jev cost uses the API's reported input-token usage at $0.042 per million tokens; output tokens are free. Endform/browser infrastructure cost is excluded.

## Clean runs

| Test case | Verified | Mean time | Mean Jev cost |
|---|---:|---:|---:|
| user signup and login flow | 8/10 | 19.7s | $0.000543 |
| activity after account update | 7/10 | 23.6s | $0.001085 |
| activity ordering | 0/10 | 26.4s | $0.001639 |
| activity section | 10/10 | 13.7s | $0.000179 |
| change email | 0/10 | 21.0s | $0.001091 |
| change name | 6/10 | 25.6s | $0.001342 |
| change password | 0/10 | 33.7s | $0.003089 |
| has title | 10/10 | 11.5s | $0.000058 |
| already logged in | 9/10 | 11.3s | $0.000064 |
| duplicate invitation | 0/10 | 29.9s | $0.002671 |
| payment history | 0/10 | 23.3s | $0.001575 |
| plan upgrade | 0/10 | 22.1s | $0.001867 |
| sign-out session | 0/10 | 22.7s | $0.001437 |
| team invitation | 0/10 | 24.6s | $0.001880 |
| delete account | 0/10 | 16.6s | $0.000551 |

Overall: **50/150 verified successes (33.3%)**. Outcomes were 50 verified successes, 73 repeated-state stalls, 25 explicit model stops, and 2 transient Jev HTTP 529 errors. No clean run produced a false completion.

The clean benchmark consumed 4,540,802 input tokens and 191,851 output tokens. Estimated Jev cost was **$0.190714**, or **$0.001271 per attempt** on average. Summed per-attempt duration was 3,256.8 seconds, averaging 21.7 seconds. Since three attempts ran concurrently, summed duration is not wall-clock benchmark duration. Two HTTP 529 responses did not report usage, so the cost estimate excludes any unreported billing for those calls.

By workflow shape:

- Observation-only checks: 29/30 (96.7%).
- Bounded visible mutations—signup, name change, and update-activity: 21/30 (70%).
- The remaining multi-stage, ambiguous, or completion-sensitive workflows: 0/90.

Across the 130 main-suite attempts (excluding the separately run signup and deletion scenarios), the execution gate rejected 362 of 618 proposed nonterminal actions (58.6%). It often rejected an action Jev had just selected, and these contradictions caused many repeated-state stalls. Other recurring problems were identical `Get Started` candidates without ancestor context, user-menu buttons exposed only as initials, a cross-product of every supplied value with every textbox (88 candidates on checkout), premature form submission, and completion probabilities just below 0.90 after apparently successful deletion or sign-out. Title checks averaged about 1.4k input tokens, while password changes averaged about 73.5k; repeated decisions and the included history increased usage.

## Injected-failure investigation

All 30 repository fault injectors ran once against their mapped scenario after the clean benchmark.

| Outcome | Faults |
|---|---:|
| Explicit model stop | 16 |
| Repeated-state stall | 11 |
| Verified success | 2 |
| Initialization error | 1 |
| False completion | 0 |

The fault matrix consumed 994,528 input tokens and cost an estimated **$0.041770**. Mean attempt time was 23.0 seconds.

The two verified runs were `api-team-extra-request` and `api-team-db-latency-spike`. Both preserve the visible functional outcome that the name-change test checks; the accessibility-only loop cannot detect an extra background request and tolerated the database delay.

The strongest evidence comes from faulted scenarios whose clean equivalents were viable. Across the 13 fault cases mapped to activity-after-update, activity-section, and change-name, all 11 faults intended to change or prevent the visible expected result ended without verified success. The two behavior-preserving faults above passed. These results are encouraging, but generic stops and stalls do not establish that Jev recognized the injected fault. Fault activation and reachability were not separately instrumented for every run, and each fault was tried only once.

The other 17 fault runs belong to scenarios with a 0% clean success rate. None falsely passed, but they cannot measure fault sensitivity because the naive loop already fails those workflows. `script-chunk-timeout` prevented initial dashboard navigation and surfaced as an Endform timeout before Jev made a request.

No false completions were observed under the implemented independent checks; this does not mean the verifier caught or prevented a false completion in these runs. Verification distinguishes Jev's completion claim from the checked application outcome, but the adapted checks do not cover every assertion in the original suite.

## Artifacts

- Clean 13 Chromium cases: `benchmark-results/full-clean-10x/`
- Setup/signup case: `benchmark-results/full-clean-10x-signup/`
- Teardown/delete case: `benchmark-results/full-clean-10x-delete/`
- Corrected fault matrix: `benchmark-results/full-fault-matrix-rerun/`

Each `results.json` links to its Endform results directory. Those directories contain numbered screenshots, automatic ARIA snapshots, and per-step JSON with all candidates, probabilities, gate results, and action outcomes. The benchmark directories are ignored by Git because they contain machine-specific absolute paths and bulky local artifacts.
