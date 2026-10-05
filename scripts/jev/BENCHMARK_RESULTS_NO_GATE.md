# Jev benchmark: no execution gate

## September 28, 2026 comparison

**72/150 verified successes (48.0%) without the gate, compared with 57/150 (38.0%) with it: +15 verified passes, or +10.0 percentage points.**

This report is separate from [the contextual gated benchmark](BENCHMARK_RESULTS.md), which remains unchanged. Both runs use contextual action descriptions, all 15 clean scenarios, ten repetitions each, and concurrency three. The no-gate implementation is commit `f2858ef`; the gated implementation is `7b6d4dc` (results committed in `c9c124e`).

### The single algorithm change

The selector still judges completion and chooses among bounded click/fill/check/navigation actions plus wait and stop. The chosen action now executes directly, without a second Jev request or action-confidence threshold. Existing candidate filtering, reference validation, supplied-value restrictions, and Playwright action checks remain.

The completion threshold remains 0.90. The suite still allows 30 iterations and seven minutes after startup, retains five history entries, and stops after the fourth repeated selection on the same snapshot. Input values, contextual descriptions, action-selection instructions, completion instructions, setup/cleanup, and independent verification are unchanged. No extra delay, progress tracking, or verifier changes were introduced. Removing a model call also changes the elapsed time between observing the page and acting on it.

### Validation and reporting policy

- Eight focused unit tests, TypeScript, targeted lint, and whitespace checks passed.
- The requested single name-change smoke run **stopped without verification** after six steps. It executed the name fill and save, then navigated to Team Settings while the prior snapshot still showed `Saving...`. John Doe was visible on Team Settings, but the required success message had not been observed; completion remained at 0.44–0.46. This smoke result is retained separately and excluded from the 150-run table.
- The implementation was frozen after that smoke run. The full benchmark was run without tuning it to the smoke outcome.
- Attempts interrupted by Jev API failures are discarded and rerun so each scenario retains ten completed attempts. No such replacements were needed in this batch.
- All 150 retained attempts have one model request per iteration; inspection of the saved decision records confirmed no execution-gate calls.
- These are the 15 clean scenarios. Fault injection was not rerun in this comparison.

```sh
bun test scripts/jev-loop.test.ts scripts/jev-benchmark.test.ts scripts/jev/action-context.test.ts
bun scripts/jev-benchmark.ts --mode clean --case change-name --repeat 1 --concurrency 1 --output benchmark-results/no-gate-name-change-smoke
bun scripts/jev-benchmark.ts --mode clean --repeat 10 --concurrency 3 --output benchmark-results/no-gate-full-clean-10x
```

### Results by scenario

| Scenario | Gated verified | No-gate verified | Gated mean time | No-gate mean time | Gated mean cost | No-gate mean cost |
|---|---:|---:|---:|---:|---:|---:|
| signup-and-login | 10/10 | 10/10 | 20.7s | 19.4s | $0.000635 | $0.000430 |
| activity-after-account-update | 10/10 | 10/10 | 18.1s | 17.3s | $0.000590 | $0.000417 |
| activity-order | 0/10 | 0/10 | 30.3s | 25.8s | $0.002260 | $0.001750 |
| activity-section | 10/10 | 10/10 | 13.8s | 13.7s | $0.000190 | $0.000142 |
| change-email | 0/10 | 0/10 | 26.4s | 38.9s | $0.002044 | $0.002740 |
| change-name | 10/10 | 10/10 | 20.5s | 18.8s | $0.000844 | $0.000554 |
| change-password | 0/10 | 0/10 | 30.6s | 54.9s | $0.003150 | $0.005465 |
| has-title | 10/10 | 10/10 | 12.2s | 11.5s | $0.000064 | $0.000064 |
| already-logged-in | 6/10 | 6/10 | 11.4s | 10.9s | $0.000072 | $0.000072 |
| duplicate-invite | 0/10 | 6/10 | 26.9s | 21.7s | $0.002408 | $0.001202 |
| payment-history | 0/10 | 0/10 | 22.7s | 22.6s | $0.002885 | $0.003263 |
| plan-upgrade | 0/10 | 0/10 | 24.7s | 30.4s | $0.003683 | $0.005324 |
| signout-session | 1/10 | 6/10 | 25.2s | 16.7s | $0.001803 | $0.000377 |
| team-invitation | 0/10 | 4/10 | 24.1s | 26.9s | $0.001872 | $0.001605 |
| delete-account | 0/10 | 0/10 | 16.3s | 15.3s | $0.000587 | $0.000405 |

### Aggregate comparison

| Metric | Gated | No gate |
|---|---:|---:|
| Verified success | 57 (38.0%) | 72 (48.0%) |
| Repeated-state stall | 77 | 10 |
| Model stopped | 16 | 67 |
| Step limit | 0 | 1 |
| False completion under existing verification | 0 | 0 |
| Mean iterations per attempt | 5.55 | 7.79 |
| Model requests | 1,514 | 1,169 |
| Input tokens | 5,497,283 | 5,669,571 |
| Output tokens | 218,573 | 300,474 |
| Estimated total Jev cost | $0.230886 | $0.238122 |
| Mean attempt duration | 21.6s | 23.0s |
| Summed attempt duration | 3,238.6s | 3,445.6s |
| Successfully executed browser actions (excludes waits) | 311 | 879 |
| Executed waits | 19 | 140 |
| Browser action execution errors | 0 | 1 |

Model requests fell by 22.8%, but total estimated Jev cost rose by 3.1% and mean duration rose by 6.4%. Longer trajectories and larger later-history contexts offset the removed gate requests. Cost uses the unchanged assumption of $0.042 per million input tokens and free output tokens, recorded September 22, 2026. It excludes Endform/browser infrastructure and the separate smoke test. Durations include setup, screenshots, model calls, verification, and cleanup; summed duration is not wall-clock duration because three sessions run concurrently.

### What improved

- Duplicate invitation improved **0/10 → 6/10**.
- Sign-out improved **1/10 → 6/10**.
- Team invitation improved **0/10 → 4/10**.
- Every other scenario retained the same verified-pass count as the gated comparison. Six scenarios still have zero verified successes.
- Name change remained **10/10** in the full batch and became faster and cheaper on average, despite the separate smoke run exposing a timing-sensitive failure.

### Remaining failures and observed downsides

**More progress does not guarantee recognized completion.** Activity-order run 1 executed the name update, password update, and navigation to Activity, but subsequently returned to General and stopped without verification. Email-change run 1 updated the email, signed out, filled the new email and password, submitted sign-in, then stopped later at 0.67 completion confidence. Past milestones can fall outside the unchanged five-entry history.

**Repeated mutations replace some gate stalls.** Password-change run 1 changed the password and signed in using the new password, then revisited Security and tried to change it again with the old current password. Later snapshots showed `Current password is incorrect.` and `New password must be different from the current password.` All ten password scenarios still failed; one reached the 30-step limit, and mean duration grew from 30.6s to 54.9s.

**Premature checkout actions remain a problem.** Payment history had ten model stops and plan upgrade had ten repeated-state stalls. These workflows did not gain a verified pass from executing actions that the gate had previously rejected.

**Removing the gate also removes incidental waiting.** The smoke run navigated away while saving was still in progress, before capturing the success message. This is evidence for investigating explicit observation of pending work in a future variant, not a reason to silently add a delay to this one.

**Execution success is narrower than task success.** The single recorded browser execution error was a five-second fill timeout in email-change run 3. Validation errors and unnecessary submissions usually do not throw Playwright errors, so the 879 successful browser-action calls are not 879 correct decisions.

### Interpretation and limits

This batch supports removing the generic execution gate as a useful direction: it increased verified completion by ten percentage points and unlocked three previously difficult workflows. It did not improve every task or lower aggregate cost and runtime. Completion recognition, short history, and form behavior remain important limitations.

The same independent verifiers were deliberately retained for comparability. They do not establish every required historical transition (for example, the password verifier only checks the final dashboard), so zero observed false completions does not prove the no-gate controller cannot falsely pass. Stronger verification and a fresh fault-injection experiment would be needed for that claim.

The runs were sequential batches on the same date, not an interleaved randomized experiment. Each scenario has ten repetitions. The controller defaults to the floating `jev-latest` alias and does not persist the returned model revision, so service/model variation can affect comparisons.

### Artifacts

- No-gate full batch: `benchmark-results/no-gate-full-clean-10x/results.json` and `report.md`.
- Separate no-gate smoke: `benchmark-results/no-gate-name-change-smoke/`.
- Gated comparison batch: `benchmark-results/context-full-clean-10x/`.
- Gated summary: [BENCHMARK_RESULTS.md](BENCHMARK_RESULTS.md).

Run records point to local Endform directories containing all step decisions, accessibility snapshots, and screenshots. These bulky machine-local artifacts remain ignored by Git; this comparison is committed separately.
