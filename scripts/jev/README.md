# Jev test loop

Run from the repository root:

```sh
bun run jev:test
```

Requires installed project dependencies, an authenticated Endform CLI (`pnpm exec endform login`), and `JEV_API_KEY=...` in the git-ignored `.env.jev` file. The controller loads that file automatically and removes the key from the Endform subprocess environment. `JEV_MODEL` optionally selects a model (default `jev-latest`); `ENDFORM_BIN` optionally points to another CLI binary. `BASE_URL` overrides the hosted tutorial app.

`name-change.json` is the frozen, AI-authored text specification derived from `tests/change-name.spec.ts`. It contains the aim, supplied text values, and success criteria, not locators or an action sequence. The minimal harness uses the same user creation/cookie/cleanup helpers as that test. Its separate Playwright config avoids the original suite's telemetry dependency and setup projects.

The Bun controller starts one Endform live session, paused before the harness body, and navigates to the authenticated dashboard. Every iteration reads the current AI accessibility snapshot and creates click/fill candidates using its references. Jev chooses the next action and judges completion in one request. Selected actions execute without a separate model execution gate or action-confidence threshold. Only supplied input values can be entered. No generative model runs inside the loop.

Current experimental completion threshold: >= 0.9. The loop allows 20 iterations, five minutes after startup, and at most three repetitions of an action on an unchanged snapshot. These are initial settings, not calibrated confidence guarantees. Execution failures return to observation; terminal failure exits nonzero.

When Jev says done, independent Playwright checks require an observed success message, the team page, and the updated name both before and after reload. These checks never guide Jev. Session cleanup runs on completion, failure, or Ctrl-C (after the in-flight command finishes). The terminal prints every available action with its Jev probability, the selected action, and the completion probability.

```sh
bun test scripts/jev-loop.test.ts scripts/jev-benchmark.test.ts scripts/jev/action-context.test.ts scripts/jev/progress.test.ts scripts/jev/clairic.test.ts
```

## Suite benchmark

Run all 15 listed Playwright tests ten times each, including the setup and teardown project tests as isolated scenarios:

```sh
bun run jev:benchmark
```

Run every configured fault once against its intended scenario:

```sh
bun run jev:benchmark:faults
```

`scripts/jev/cases.ts` contains the frozen aims, supplied values, success criteria, independent verification code, and fault mapping. Setup and teardown are adapted to run independently: signup begins with cleared cookies and cleans up its created account, while account deletion receives a fresh authenticated user. The default concurrency is three and can be overridden with `--concurrency N`. Reports are written under the ignored `benchmark-results/` directory. Its `screenshots/` folder links to every run's numbered images. Individual run records link to the corresponding Endform result directory with per-step choices and automatic accessibility snapshots.

Outcomes distinguish verified success from false completion, an explicit model stop, repeated-state stalls, limits, and infrastructure or script errors. Timings include Endform session startup, the Jev loop, independent verification, and cleanup.

Both controllers retain each target's live accessibility reference in its action description. They also include up to six context lines from named ancestors and preceding descriptive siblings within those ancestors (prioritizing the nearest heading). This distinguishes repeated labels such as pricing-card buttons using the existing accessibility tree, without application-specific rules or extra browser reads. The same description reaches action selection and history. The no-gate variant preserves input candidates, the completion threshold, and verification.

## Variants, screenshots, and the stepwise controller

`--variants a,b,...` runs several controller configurations in one batch. Each scenario runs once per variant before the next scenario starts, so variants share the app, Jev service, and infrastructure conditions instead of running in separate batches. `scripts/jev/variants.ts` defines them; each flag is one general algorithm change, and none uses application-specific selectors or text:

| Flag          | Change                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `images`      | Send the current full-page screenshot as a Jev image asset (`TypeSafe-Danger-Zone-Images: true`), next to the accessibility tree. Tall pages are scaled to fit Jev's 280–1568 px limits (`images.ts`).                                                                                                                                                                                                             |
| `settle`      | After each action, wait until no request younger than five seconds is in flight and the accessibility tree has been unchanged for 500 ms (at most five seconds), then observe.                                                                                                                                                                                                                                     |
| `memory`      | Keep every past action in history, each with its result, resulting page, and the page text that appeared (`newPageText`), instead of the last five actions with full accessibility trees. Unchanged pages are reported as such.                                                                                                                                                                                    |
| `fieldValues` | Offer one fill per field instead of every value × every field; a Choice per field picks which supplied value (or none) belongs there. Fills that would leave a field unchanged are skipped. Actions report the browser's constraint-validation bubble (for example "Please fill out this field."), which neither screenshots nor accessibility snapshots capture.                                                  |
| `finish`      | Split the old stop option into _finish_ (a completion claim, independently verified like done ≥ 0.9) and _stop_ (the aim cannot be reached).                                                                                                                                                                                                                                                                       |
| `skipNoops`   | Do not offer an action again on a page state it left unchanged.                                                                                                                                                                                                                                                                                                                                                    |
| `steps`       | Split the aim into its ordered clauses (`progress.ts`). Each iteration first asks one Noul per unfinished part, extends the run of finished parts from the start (finished parts stay finished), then asks for the action that accomplishes the current part. Completion claims need every part but the last to be finished. Within a part, an action already tried from the same page state is not offered again. |
| `escape`      | Offer pressing Escape. Modal menus hide the rest of the page from the accessibility tree, leaving no other way back.                                                                                                                                                                                                                                                                                               |

`text-1.13` reproduces the September 28 no-gate controller; `text` is the same controller on Jev 1.14; `images` adds only the screenshot. `stepwise` enables every flag and is the default (`bun run jev:benchmark`); `stepwise-text` is the same without screenshots, measured within noise of it at under half the Jev cost. Variants pin `jev-1.14.0` (or `jev-1.13.0`) rather than a moving alias. Jev's `box` question type is not used: every candidate is already grounded by its accessibility reference. The single-scenario `bun run jev:test` demo above is unchanged and remains text-only.

A run whose live session fails to start is retried up to twice; failures after the session starts are always counted. `--resume` with the same `--output` keeps recorded attempts (except sessions that never started) and runs the rest. Jev 429/5xx responses are retried with backoff and counted per run (`apiRetries`).

```sh
bun scripts/jev-benchmark.ts --mode clean --repeat 10 --concurrency 6 --variants text,images,stepwise,stepwise-text
```

The change-password, change-email, and delete-account verifiers originally passed on states a premature completion claim could reach (the dashboard is already showing at the start of change-password). They now check the outcome: the activity log must show a sign-in after the password change or account update, the new password must sign in from a fresh browser context, and deleted credentials must no longer sign in.

## Clairic: pointing instead of choosing

[Clairic](https://developers.cloudflare.com/workers-ai/models/clairic/) is Cloudflare's extraction model (Workers AI, preview since October 19, 2026). Instead of choosing among options, it answers typed fields; a `text` field is an exact span of the input. The `clairic` controller (`clairic.ts`) uses that to drop candidate actions entirely. Each step sends one plain-text state:

```text
Aim, success criteria, supplied values, direct URLs (/dashboard and any captured invitation URL),
a numbered log of past actions ("Clicked - button "General" [ref=e20] -> done; now on /dashboard/general"),
the current URL and title, and the accessibility tree
```

and asks for four span fields:

| Field     | Instruction (abridged)                                                   |
| --------- | ------------------------------------------------------------------------ |
| `element` | The ref (like e12) of the interactive element to click or type into next |
| `text`    | The supplied value to type into that element, or null                    |
| `url`     | A path from Direct URLs to open instead, or null                         |
| `done`    | Quote the text showing every success criterion is met, or null           |

Code turns the answers into one action: if `done` is not null, independent verification runs. Otherwise, if `element` is a reference on the page, its role decides the action (textboxes are filled with `text`, checkboxes and radios are checked, everything else is clicked); otherwise `url` is opened; with neither, the run ends as a model stop. Only the first token of a span is read, because spans can run on into the next line. Actions settle like the stepwise controller; the 30-step, seven-minute, and repeated-state limits are unchanged.

`clairic-screenshot` adds the page screenshot (`images`), and `clairic-clef` replaces the `done` quote with a Clef Noul ("Have ALL success criteria been met?", claimed at ≥ 0.90), asked in parallel.

Clairic variants need `CLOUDFLARE_ACCOUNT_ID` and a Workers AI `CLOUDFLARE_API_TOKEN` in `.env.jev`; the token is removed from the Endform subprocess environment like `JEV_API_KEY`. Cost uses Workers AI input prices ($0.10 per million tokens for Clairic, $0.24 for Clef; no output charge), recorded in the existing `estimatedJevUsd` field.

```sh
bun scripts/jev-benchmark.ts --mode clean --repeat 10 --concurrency 6 --variants text,clairic,clairic-screenshot,clairic-clef
```

## Inspect a run

To watch screenshots arrive in a browser, start the local viewer:

```sh
bun run jev:viewer
```

Open http://127.0.0.1:3031, then run `bun run jev:test` in another terminal.
Keep the viewer beside your editor or terminal. It polls every 500 ms and displays
the newest complete screenshot without refreshing the page. These are still images
captured after each step, not browser video; the last image remains after the run ends.

The controller writes its session and results directory to
`test-results/jev-current-run.json` when the session starts. The viewer follows this
pointer automatically, including when you start another run. Both the pointer and
screenshots are published with atomic renames so the viewer never reads a partially
written file. The pointer is ignored by Git with the rest of `test-results/`.
This viewer follows the single `jev:test` controller, not concurrent benchmark runs.

The script prints its Endform results folder (`test-results/live-session-<session-id>/`). It contains:

- `screenshots/00-initial.png`, numbered `NN-after.png` images after each action, wait, or rejection, and a final `NN-verified-after-reload.png` on success. The initial image is the state for decision 1; each after-image is the state for the next decision.
- `step-NN-choices.json`: all candidates, answer probabilities, action result.
- `jev-cost.json`: API-reported token totals, model revisions, and the estimated Jev cost.
- Endform's automatically saved `run-*-ai-aria-snapshot.yml` files.

Endform captures ARIA snapshots automatically after commands (including failures). The CLI saves them but only prints the command's stdout/stderr, so the controller reads the newly saved snapshot instead of calling `page.ariaSnapshot()` again. Screenshots are **explicit**: the controller calls `page.screenshot()` in the worker's current directory, and Endform transfers the new PNG back automatically. The controller groups copies under `screenshots/`. Screenshots and snapshots are sequential observations, not an atomic capture of an animating page. Capturing screenshots also adds latency to the loop.

Cost is estimated at $0.042 per million input tokens and $0 for output tokens, using [TypeSafe's published pricing](https://typesafe.ai/blog/introducing-system-one-models-and-jev), checked September 22, 2026. Selection/completion requests count; this variant makes no execution-gate requests. Missing usage (including failed API requests) is flagged as a partial estimate. This estimates Jev API charges only, excluding Endform/browser infrastructure, and is not an invoice.

The contextual gated baseline is recorded in `BENCHMARK_RESULTS.md`. The separate no-gate comparison is recorded in `BENCHMARK_RESULTS_NO_GATE.md`. The screenshot and stepwise comparison, with its fault matrix, is recorded in `BENCHMARK_RESULTS_IMAGES.md`. The naive Clairic loops are compared with the naive Jev loop in `BENCHMARK_RESULTS_CLAIRIC.md`. Every variant keeps the 30-iteration and seven-minute limits and the repetition guard.
