# Clairic: driving Playwright without a list of options

## October 19, 2026

Jev and Clef are decision models: they can only pick from options you write down, so every earlier controller first turned the page into a menu of candidate actions. [Clairic](https://developers.cloudflare.com/workers-ai/models/clairic/), released on Workers AI as a preview on October 19, is an extraction model. It answers typed fields, and a `text` answer is an exact span of the input. That allows a much simpler loop: put the page in the state and let Clairic point at what to do next.

This report benchmarks the simplest version of that loop, and two one-idea variations, against the naive Jev loop on the same 15 scenarios.

### The naive Clairic loop

Each step sends one plain-text state:

```text
Aim: Starting on the authenticated dashboard, change your name to John Doe in general settings. ...
Success criteria:
- The account update success message has been observed after saving.
- ...
Supplied values: "John Doe"
Direct URLs: /dashboard
Actions so far:
1. Clicked - button "General" [ref=e20] -> done; now on /dashboard/general
Current page: https://.../dashboard/general (Playwright Tutorial)
Page accessibility tree:
- generic [ref=e1]:
  ...
```

and asks four `text` fields:

| Field     | Asks for                                                                 |
| --------- | ------------------------------------------------------------------------ |
| `element` | The ref (like e12) of the interactive element to click or type into next |
| `text`    | The supplied value to type into it, or null                              |
| `url`     | A path from Direct URLs to open instead, or null                         |
| `done`    | A quote of the text showing every success criterion is met, or null      |

The code is a few rules. If `done` is not null, independent Playwright verification decides the outcome. Otherwise, if `element` names a ref on the page, its role decides the action: textboxes are filled with `text`, checkboxes and radios are checked, and everything else is clicked. If not, `url` is opened. With neither, the run stops. That is the whole controller: no candidate actions, no thresholds, and no app-specific rules. Settling after actions, the 30-step and seven-minute limits, the repeated-state guard, and the strengthened verifiers are shared with the Jev runs.

The two variations each change one thing:

- `clairic-screenshot` also sends the page screenshot.
- `clairic-clef` drops the `done` quote and asks Clef, in parallel, "Have ALL success criteria been met?" (claimed at ≥ 0.90), like the Jev loop's completion question.

The reference `text` is the September no-gate Jev loop on Jev 1.14: a menu of click, fill, and check options built from the same accessibility tree.

### Results

| Variant                   |            Verified | Mean steps | Mean time | Model cost per attempt |
| ------------------------- | ------------------: | ---------: | --------: | ---------------------: |
| `text` (Jev, option menu) | **110/150 (73.3%)** |       7.97 |     42.3s |                $0.0019 |
| `clairic`                 |  **42/150 (28.0%)** |       8.01 |     49.3s |                $0.0035 |
| `clairic-screenshot`      |  **30/150 (20.0%)** |       9.25 |     57.8s |                $0.0082 |
| `clairic-clef`            |  **53/150 (35.3%)** |      10.67 |     61.0s |                $0.0066 |

| Scenario                      |  text | clairic | clairic-screenshot | clairic-clef |
| ----------------------------- | ----: | ------: | -----------------: | -----------: |
| signup-and-login              | 10/10 |    0/10 |               0/10 |         2/10 |
| activity-after-account-update | 10/10 |    0/10 |               0/10 |        10/10 |
| activity-order                |  9/10 |    0/10 |               0/10 |         0/10 |
| activity-section              | 10/10 |   10/10 |              10/10 |        10/10 |
| change-email                  |  0/10 |    0/10 |               0/10 |         0/10 |
| change-name                   | 10/10 |    0/10 |               0/10 |         0/10 |
| change-password               |  0/10 |    0/10 |               0/10 |         0/10 |
| has-title                     |  9/10 |   10/10 |              10/10 |        10/10 |
| already-logged-in             |  9/10 |   10/10 |              10/10 |        10/10 |
| duplicate-invite              |  6/10 |    2/10 |               0/10 |         1/10 |
| payment-history               | 10/10 |    0/10 |               0/10 |         0/10 |
| plan-upgrade                  | 10/10 |    0/10 |               0/10 |         0/10 |
| signout-session               |  7/10 |    0/10 |               0/10 |         0/10 |
| team-invitation               | 10/10 |    0/10 |               0/10 |         0/10 |
| delete-account                |  0/10 |   10/10 |               0/10 |        10/10 |

| Outcome                              | text | clairic | clairic-screenshot | clairic-clef |
| ------------------------------------ | ---: | ------: | -----------------: | -----------: |
| Verified success                     |  110 |      42 |                 30 |           53 |
| False completion (verifier rejected) |    2 |      58 |                 40 |            0 |
| Model stopped                        |   31 |       0 |                 25 |            0 |
| Repeated-state stall                 |    0 |      39 |                 44 |           76 |
| Step limit                           |    7 |      11 |                 11 |           21 |

The Jev reference reproduces the October 16 measurement of the same controller (110 vs 109 of 150).

### What worked

**Pointing works for the next step.** Without any option list, Clairic usually named a real, sensible element: in change-name it went General → typed "John Doe" into Name → Save Changes, the same opening as a hand-written test. Invalid references were rare (9 of 1,201 steps in `clairic`), as were clicks on non-interactive containers (25) and typed text that was not a supplied value (9).

**Short tasks pass every time.** Every Clairic variant passed the three observation checks (activity-section, has-title, already-logged-in) 10/10. `clairic` and `clairic-clef` passed delete-account 10/10, where the Jev loop never did: Jev's completion score stayed just under 0.90 and it chose to stop.

### What failed

**The model quotes the goal as proof.** Asked to quote the text showing the aim is complete, `clairic` produced a quote 100 times. 73 of those came from the aim, success criteria, or action log, not the page: it quoted "Delete the current account by entering…" or "The current page is Sign in" from the state itself. In change-name it quoted "Account Information" right after saving, one step before returning to Team Settings. That produced 58 false completions, all rejected by verification. Passes happened only when the work was already finished by the time a quote appeared.

**Without that shortcut, it does not know when to stop.** With Clef judging completion, false completions dropped to zero, but 97 of 150 runs stalled or hit the step limit. The action log says what was clicked, not what the page answered, so after "Save Changes" Clairic saw no reason to move on and clicked Save again until the repeat guard ended the run. Clef's completion score stayed low: across the 97 failed runs, the median of each run's highest score was 0.02 (90th percentile 0.04).

**Multi-step flows mostly never finish.** Apart from delete-account, every scenario that needs more than a couple of actions scored at most 2/10 in every Clairic variant. Typical traces bounce between pages (plan-upgrade: Change Plan → open /dashboard → Change Plan again): 25–35% of all steps opened a direct URL, and 95% of those in `clairic` reopened `/dashboard`. Checkout was reached in about half of the plan-upgrade and payment-history attempts and never completed.

**The screenshot made it worse again.** As with Jev, adding the screenshot lowered the pass rate (28% → 20%), raised cost 2.4×, and added more stops and stalls.

### Cost and speed

Clairic is priced at $0.10 per million input tokens (Jev: $0.042; Clef: $0.24), with no output charge. A naive Clairic attempt cost about $0.0035 against $0.0019 for Jev, mostly from the higher price; `clairic-clef` pays for two models per step. In a manual check, Clairic answered a 2,800-token state in about 0.6 seconds; per-request latency was not recorded in the benchmark.

### Method and limits

- All four variants ran interleaved, scenario by scenario, with fresh users and live Endform sessions. The batch started at concurrency 6 and was resumed at concurrency 9 to finish sooner; the six attempts in flight at the switch were rerun.
- Three attempts failed on infrastructure (a screenshot that never transferred back from the Endform worker, and a live session that ended early). They were moved aside and rerun; none of the replacements passed.
- The loop was fixed after two smoke runs on three scenarios, before this batch: the first version mixed "element or URL" in one field (Clairic pointed at the URL line instead of the page) and read whole spans, which can run on into the next line of the state. The measured version splits `url` into its own field and reads the first token of each span.
- Clairic is a preview checkpoint, released the day of this benchmark. Each scenario has ten attempts.

### Takeaways for a naive implementation

Letting the model point instead of choose makes the controller very small: four fields and a role lookup, no menu building. On this suite that simplicity costs reliability. The naive Clairic loop passes 28% of attempts against 73% for an equally naive option menu with Jev. The gap comes from completion and memory, not from finding elements. The obvious next steps are the same lessons the Jev stepwise controller learned: record what the page said after each action, only accept completion evidence that comes from the page, and track progress through the parts of the aim.

### Commands

```sh
bun scripts/jev-benchmark.ts --mode clean --repeat 10 --concurrency 6 --variants text,clairic,clairic-screenshot,clairic-clef --output benchmark-results/clairic-10x
bun scripts/jev-benchmark.ts --mode clean --repeat 10 --concurrency 9 --variants text,clairic,clairic-screenshot,clairic-clef --output benchmark-results/clairic-10x --resume
```
