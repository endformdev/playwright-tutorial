# Jev Playwright benchmark results

## September 28, 2026: identifiable action descriptions

Measured on branch `oliver/jev-test-loop`, implementation commit `7b6d4dc`, against the hosted Playwright tutorial application. This is the full clean benchmark: all 15 scenarios, ten runs each, with concurrency three. The September 22 results are retained as the comparison baseline below.

**Result: 57/150 verified successes (38.0%), compared with 50/150 (33.3%) previously: seven more passes, or +4.7 percentage points.**

### Change under test

Both the single-name-change controller and the suite benchmark now retain the target accessibility reference in every element action description. A shared helper adds up to six context lines from named ancestors and preceding descriptive siblings, prioritizing the nearest heading. This uses only the existing accessibility tree, with no application-specific selectors or additional DOM reads. Selection, execution gating, and action history receive the same identifiable description.

For example, the recorded pricing actions now distinguish:

```text
Click - button "Get Started" [ref=f1e59] (context: - heading "Base" [level=2] [ref=f1e18]; - paragraph [ref=f1e19]: with 7 day free trial)
Click - button "Get Started" [ref=f1e60] (context: - heading "Plus" [level=2] [ref=f1e37]; - paragraph [ref=f1e38]: with 7 day free trial)
```

Input values and candidate combinations, the execution gate, the completion threshold, history length, and independent verification are unchanged. No named-input changes were made, keeping the experiment focused on action descriptions.

### Method and validation

- Fresh isolated user and Endform live-test session for each attempt; signup clears cookies and deletion starts with a fresh account.
- Completion threshold: 0.90; execution threshold: 0.80; maximum 30 iterations; seven-minute loop deadline after startup.
- The model sees text accessibility snapshots. Screenshots are retained for inspection, not sent to Jev.
- Independent Playwright verification runs when Jev declares completion. Existing verifier limitations remain; these checks do not prove every historical transition required by every aim.
- Reporting policy: attempts interrupted by Jev API failures are discarded and rerun, retaining ten completed attempts per scenario. Timing and cost describe retained attempts.
- Eight focused unit tests passed, including duplicate button labels, scoped sibling headings, named ancestors, disabled targets, and literal action arguments. TypeScript and targeted lint checks passed.
- Before pushing the implementation, a separate ten-run name-change validation produced **9/10 verified successes and one stall**. It is excluded from the 150-run table below.

Commands:

```sh
bun test scripts/jev-loop.test.ts scripts/jev-benchmark.test.ts scripts/jev/action-context.test.ts
bun scripts/jev-benchmark.ts --mode clean --case change-name --repeat 10 --concurrency 3 --output benchmark-results/context-name-change-10x
bun scripts/jev-benchmark.ts --mode clean --repeat 10 --concurrency 3 --output benchmark-results/context-full-clean-10x
```

### Full clean results

| Scenario | Previous verified | New verified | Mean time | Mean Jev cost |
|---|---:|---:|---:|---:|
| signup-and-login | 8/10 | 10/10 | 20.7s | $0.000635 |
| activity-after-account-update | 7/10 | 10/10 | 18.1s | $0.000590 |
| activity-order | 0/10 | 0/10 | 30.3s | $0.002260 |
| activity-section | 10/10 | 10/10 | 13.8s | $0.000190 |
| change-email | 0/10 | 0/10 | 26.4s | $0.002044 |
| change-name | 6/10 | 10/10 | 20.5s | $0.000844 |
| change-password | 0/10 | 0/10 | 30.6s | $0.003150 |
| has-title | 10/10 | 10/10 | 12.2s | $0.000064 |
| already-logged-in | 9/10 | 6/10 | 11.4s | $0.000072 |
| duplicate-invite | 0/10 | 0/10 | 26.9s | $0.002408 |
| payment-history | 0/10 | 0/10 | 22.7s | $0.002885 |
| plan-upgrade | 0/10 | 0/10 | 24.7s | $0.003683 |
| signout-session | 0/10 | 1/10 | 25.2s | $0.001803 |
| team-invitation | 0/10 | 0/10 | 24.1s | $0.001872 |
| delete-account | 0/10 | 0/10 | 16.3s | $0.000587 |

Outcomes: **57 verified successes, 77 repeated-state stalls, and 16 model stops**. No false completions or step/time-limit outcomes were observed under the existing checks.

The retained runs consumed **5,497,283 input tokens** and **218,573 output tokens**, for an estimated **$0.230886** in Jev usage ($0.001539 per run). This uses the unchanged benchmark pricing assumption of $0.042 per million input tokens and free output tokens, recorded September 22, 2026; it excludes Endform/browser infrastructure and is not an invoice. The previous clean estimate was $0.190714.

Mean duration was **21.6s**; summed duration was **3,238.6s**. Durations include startup, screenshots, model decisions, verification, and cleanup. Summed duration is not wall-clock duration because three sessions ran concurrently, and failed runs are included in the averages.

### What changed, and what still fails

- Signup improved from 8/10 to 10/10, activity after account update from 7/10 to 10/10, and name change from 6/10 to 10/10. Sign-out improved from 0/10 to 1/10.
- The logged-in observation check regressed from 9/10 to 6/10. Its four stopped runs had completion scores of 0.87–0.89, below the unchanged 0.90 threshold; they never reached independent verification.
- Eight scenarios still have zero verified successes. Identifiable targets do not resolve every execution or completion problem.
- In payment-history run 1, the model selected the explicitly identified Plus button and reached checkout. It then repeatedly proposed the purchase button before filling the form; the execution gate rejected those proposals.
- In activity-order run 1, the name fill and save executed, but subsequent navigation toward Security was repeatedly rejected. In password-change run 1, the password fields and submit executed, but the initials-only user-menu button was repeatedly rejected. Context from the tree cannot supply semantics that the tree does not expose.
- Nine deletion runs stopped on the sign-in page with completion probabilities of 0.64–0.86; the other stopped on Security at 0.88. None reached verification, so apparent browser progress is not counted as a verified deletion.
- Across all 150 attempts, the gate rejected **352/682 evaluated actions (51.6%)**. On the 130 attempts excluding signup and deletion, it rejected **345/613 (56.3%)**, compared with the previously recorded 362/618 (58.6%). These counts describe evaluated gate decisions, excluding terminal decisions before the gate.

The net improvement is modest and concentrated in short workflows. This is a historical comparison with ten runs per scenario, not an interleaved randomized ablation. The model defaults to the floating `jev-latest` alias, and this benchmark does not persist the returned model revision. Date, model, and service variation can contribute to differences, so the observed gain cannot be attributed entirely to the code change.

### Historical fault investigation (September 22; not rerun)

The earlier 30-fault experiment remains historical evidence for the previous controller, not a measurement of this revision. Its two verified successes were `api-team-extra-request` and `api-team-db-latency-spike`, which preserved the visible name-change outcome. Eleven faults intended to disrupt visible outcomes on otherwise viable scenarios produced no verified passes. The other 17 faults targeted scenarios with no clean successes, so those failures did not establish fault sensitivity. Fault activation and reachability were not separately confirmed for every run.

### Artifacts

- New full clean results and generated report: `benchmark-results/context-full-clean-10x/`.
- Separate name-change validation: `benchmark-results/context-name-change-10x/`.
- Previous clean baseline: `benchmark-results/full-clean-10x/`, `benchmark-results/full-clean-10x-signup/`, and `benchmark-results/full-clean-10x-delete/`.
- Historical fault matrix: `benchmark-results/full-fault-matrix-rerun/`.

Each new run record points to its Endform result directory with numbered screenshots, accessibility snapshots, and step decisions. These bulky machine-local artifacts are ignored by Git; this summary is committed.
