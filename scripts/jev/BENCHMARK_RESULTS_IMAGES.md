# Jev with screenshots, and a stepwise controller

## October 16–18, 2026

Jev 1.14 (released October 14) accepts images and adds a `box` question type. This report measures what giving Jev the page screenshot does to the 15-scenario suite, then what a more general controller achieves with and without it.

| Variant         | Controller           | Model        | Screenshot |            Verified |
| --------------- | -------------------- | ------------ | ---------- | ------------------: |
| `text-1.13`     | September 28 no-gate | `jev-1.13.0` | no         |  **77/150 (51.3%)** |
| `text`          | September 28 no-gate | `jev-1.14.0` | no         | **109/150 (72.7%)** |
| `images`        | September 28 no-gate | `jev-1.14.0` | yes        |  **79/150 (52.7%)** |
| `stepwise-text` | stepwise             | `jev-1.14.0` | no         | **149/150 (99.3%)** |
| `stepwise`      | stepwise             | `jev-1.14.0` | yes        |  **150/150 (100%)** |

**Adding the screenshot to the existing controller cost 30 verified passes (72.7% → 52.7%).** The model upgrade alone gained 32 (51.3% → 72.7%). With the stepwise controller, the screenshot made no measurable difference (150 vs 149) at 2.4× the Jev cost.

### Results by scenario

| Scenario                      | text-1.13 |  text | images | stepwise-text | stepwise |
| ----------------------------- | --------: | ----: | -----: | ------------: | -------: |
| signup-and-login              |     10/10 |  9/10 |  10/10 |         10/10 |    10/10 |
| activity-after-account-update |     10/10 | 10/10 |  10/10 |         10/10 |    10/10 |
| activity-order                |      0/10 | 10/10 |   9/10 |         10/10 |    10/10 |
| activity-section              |     10/10 | 10/10 |  10/10 |         10/10 |    10/10 |
| change-email                  |      0/10 |  0/10 |   0/10 |         10/10 |    10/10 |
| change-name                   |     10/10 | 10/10 |  10/10 |         10/10 |    10/10 |
| change-password               |      0/10 |  0/10 |   0/10 |         10/10 |    10/10 |
| has-title                     |     10/10 |  9/10 |   0/10 |         10/10 |    10/10 |
| already-logged-in             |      2/10 | 10/10 |  10/10 |         10/10 |    10/10 |
| duplicate-invite              |      4/10 |  6/10 |  10/10 |         10/10 |    10/10 |
| payment-history               |      0/10 |  9/10 |   0/10 |         10/10 |    10/10 |
| plan-upgrade                  |      0/10 | 10/10 |   0/10 |         10/10 |    10/10 |
| signout-session               |     10/10 |  7/10 |   0/10 |         10/10 |    10/10 |
| team-invitation               |      5/10 |  9/10 |  10/10 |          9/10 |    10/10 |
| delete-account                |      6/10 |  0/10 |   0/10 |         10/10 |    10/10 |

| Metric                    | text-1.13 |      text |    images | stepwise-text |   stepwise |
| ------------------------- | --------: | --------: | --------: | ------------: | ---------: |
| Model stopped             |        51 |        36 |        50 |             0 |          0 |
| Repeated-state stall      |        11 |         0 |        21 |             1 |          0 |
| Step limit                |        11 |         4 |         0 |             0 |          0 |
| False completion          |         0 |         1 |         0 |             0 |          0 |
| Mean iterations           |      8.13 |      7.58 |      5.27 |          6.97 |       7.81 |
| Jev requests              |     1,219 |     1,137 |       791 |         1,963 |      2,221 |
| Input tokens              | 5,743,788 | 6,524,584 | 6,131,133 |     5,237,244 | 12,755,381 |
| Total Jev cost            |   $0.2412 |   $0.2740 |   $0.2575 |       $0.2200 |    $0.5357 |
| Mean Jev cost per attempt | $0.001608 | $0.001827 | $0.001717 |     $0.001466 |  $0.003572 |
| Mean attempt duration     |     41.9s |     41.2s |     33.3s |         44.7s |      49.0s |

A full-page screenshot (1280 px wide) adds about 2,600 input tokens per request. Cost uses $0.042 per million input tokens with free output, unchanged from September; durations include Endform session startup, verification, and cleanup.

### Why the screenshot hurt the existing controller

The screenshot was the only change in `images`: same candidates, history, thresholds, and questions, with "`screenshot` and accessibility tree" named as the current page.

- **Completion scores moved under the 0.90 threshold.** has-title and signout-session reached the right page in every attempt, but Jev's final completion probability was 0.71–0.84 with the screenshot, against 0.86–0.94 text-only. Jev then chose _stop_ because nothing was left to do, ending the run unverified. The old stop option meant both "finished" and "impossible".
- **Checkout was submitted early.** With the screenshot, Jev filled one or two fields and then clicked "Complete Purchase" repeatedly; browser validation blocked each submit without visible change. Text-only filled the fields in order and, after a blocked submit, followed the `[active]` marker the browser put on the first invalid field.
- **It did help where the action is visual.** duplicate-invite rose from 6/10 to 10/10 and team-invitation from 9/10 to 10/10.

### The stepwise controller

Every change is a flag in `variants.ts` (described in [the README](README.md#variants-screenshots-and-the-stepwise-controller)). None uses application-specific selectors or text; each targets a failure seen in traces:

| Failure in traces                                                                                        | Change                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Observing while "Saving..." was still pending                                                            | Settle: wait for in-flight requests and an unchanged accessibility tree (≤5 s)                                                                                              |
| Milestones such as "Account updated successfully." fell out of the five-entry history                    | Full compact history with the text each action produced                                                                                                                     |
| 81 value × field fill options on checkout                                                                | One fill per field; a per-field Choice picks the value                                                                                                                      |
| Blocked submits gave no feedback                                                                         | Report the browser's validation bubble; mark unchanged pages                                                                                                                |
| Completion just under 0.90 ended in _stop_                                                               | Separate _finish_ (verified claim) from _stop_ (impossible)                                                                                                                 |
| Repeated no-op submits                                                                                   | Do not re-offer an action that left the page unchanged                                                                                                                      |
| Steps done out of order or repeated (signing out before changing the email; changing the password twice) | Split the aim into ordered clauses; Jev judges each, finished parts stay finished, the action question targets the current part; claims need all but the last part finished |
| Cycling through the avatar menu                                                                          | Within a part, do not re-offer an action already tried from the same page state                                                                                             |
| Modal menu hides the rest of the page                                                                    | Offer Escape                                                                                                                                                                |

Stepwise asks two requests per iteration (progress, then action), so it uses more requests but fewer tokens per request without screenshots: $0.0015 per attempt text-only versus $0.0036 with screenshots.

The single stepwise failure (`stepwise-text` team-invitation #4) completed the invitation and signup, reached Team Settings with both members, then stayed uncertain on the final confirmation (completion 0.50–0.67) and waited on an unchanged page until the repeat guard stopped it.

Jev's `box` question type was not used: every candidate action is already grounded by its accessibility reference, so locating it in pixels adds nothing on this application.

### Verification

Making completion claims easier exposed weak verifiers. During development, the controller chose _finish_ on the first step of change-password and passed, because that verifier only checked that the dashboard was showing, which is true at the start. Three verifiers now check the outcome instead (`cases.ts`):

- change-password: the activity log shows a sign-in after the password change, and the new password signs in from a fresh browser context.
- change-email: the email is persisted, and the activity log shows a sign-in after the account update.
- delete-account: the deleted credentials no longer sign in.

Each was checked against both directions in a live session: it rejects the untouched start state and accepts a scripted genuine completion. The stepwise batch used these verifiers; the first batch used the original ones. Its only passes on these three scenarios were six `text-1.13` delete-account attempts, and their traces show a genuine deletion.

### Fault injection

All 30 faults ran once per stepwise variant (`--mode faults`).

| Outcome                              | stepwise | stepwise-text |
| ------------------------------------ | -------: | ------------: |
| Verified success                     |        6 |             7 |
| False completion (verifier rejected) |        3 |             3 |
| Model stopped                        |       15 |            15 |
| Repeated-state stall                 |        3 |             3 |
| Step limit                           |        2 |             1 |
| Error before the first decision      |        1 |             1 |

No pass broke a verified outcome:

- `api-team-extra-request`, `api-team-db-latency-spike`, and (`stepwise-text` only) `api-team-latency-spike` only add requests or delay; the September controller also passed the first two.
- `script-404` and `script-chunk-404` fail only the first script request; the flow works after the next navigation, and Jev completed it.
- `api-user-malformed-json` breaks the client `/api/user` fetch, but the root layout seeds SWR with server-fetched user data, so General still shows the persisted email.
- `signout-activity-log-missing` drops an activity entry that no verifier checks (also passed in September).

The three payment faults now reach checkout and pay; Jev claimed completion and the payment verifier rejected each claim. In September these faults were never reached. `script-chunk-timeout` fails the initial navigation before Jev runs.

### Method and limits

- Variants ran interleaved, scenario by scenario, at concurrency 6, so each comparison shares app, Jev service, and infrastructure conditions. The second batch started while the first was running.
- Both batches were interrupted when the controlling session ended on October 16 and were resumed on October 18 with `--resume` (82 of 450 and 192 of 300 attempts ran then, at concurrency 5). Twenty attempts whose live session failed to start (TLS and registration errors) were rerun; those are infrastructure, not outcomes. No Jev API retries were needed.
- The stepwise controller was developed with smoke runs on these 15 scenarios. It avoids application-specific rules, and the fault matrix checks it still fails when outcomes break, but its 100% is on the suite it was tuned against. 150/150 bounds the per-attempt failure rate only to roughly 2% (95%, rule of three).
- The aim splitter assumes aims written as sentences and comma-separated clauses, as all 15 are.
- Jev's completion probability remains poorly calibrated early: 0.72–0.81 at the start of change-password. The progress gate, not the threshold, kept those from becoming claims.

### Conclusion

On this suite, screenshots are not where the gains are: dropped into the existing loop they made things worse, and in the stepwise loop they are within noise of text-only for 2.4× the cost. The controller changes moved the suite from 72.7% (same model) to 99–100%, so this suite is saturated; further work needs harder scenarios rather than more tuning here.

### Commands

```sh
bun scripts/jev-benchmark.ts --mode clean --repeat 10 --concurrency 6 --variants text-1.13,text,images --output benchmark-results/images-vs-text-10x
bun scripts/jev-benchmark.ts --mode clean --repeat 10 --concurrency 6 --variants stepwise,stepwise-text --output benchmark-results/stepwise-10x
bun scripts/jev-benchmark.ts --mode faults --concurrency 4 --variants stepwise,stepwise-text --output benchmark-results/stepwise-faults
```

Add `--resume` to continue an interrupted batch in the same output directory. Raw results and run artifacts are under the ignored `benchmark-results/` directory.
