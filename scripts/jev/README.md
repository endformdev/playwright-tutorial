# Jev test loop

Run from the repository root:

```sh
bun run jev:test
```

Requires installed project dependencies, an authenticated Endform CLI (`pnpm exec endform login`), and `JEV_API_KEY=...` in the git-ignored `.env.jev` file. The controller loads that file automatically and removes the key from the Endform subprocess environment. `JEV_MODEL` optionally selects a model (default `jev-latest`); `ENDFORM_BIN` optionally points to another CLI binary. `BASE_URL` overrides the hosted tutorial app.

`name-change.json` is the frozen, AI-authored text specification derived from `tests/change-name.spec.ts`. It contains the aim, supplied text values, and success criteria, not locators or an action sequence. The minimal harness uses the same user creation/cookie/cleanup helpers as that test. Its separate Playwright config avoids the original suite's telemetry dependency and setup projects.

The Bun controller starts one Endform live session, paused before the harness body, and navigates to the authenticated dashboard. Every iteration reads the current AI accessibility snapshot and creates click/fill candidates using its references. Jev chooses the next action and judges completion; a second request judges whether the selected action should execute. Only supplied input values can be entered. No generative model runs inside the loop.

Current experimental thresholds: completion >= 0.9, execution >= 0.8. The loop allows 20 iterations, five minutes after startup, and at most three repetitions of an action on an unchanged snapshot. These are initial settings, not calibrated confidence guarantees. Failures and gate rejections return to observation; terminal failure exits nonzero.

When Jev says done, independent Playwright checks require an observed success message, the team page, and the updated name both before and after reload. These checks never guide Jev. Session cleanup runs on completion, failure, or Ctrl-C (after the in-flight command finishes). The terminal prints every available action with its Jev probability, the selected action, the completion probability, and the execution-gate probability.

```sh
bun test scripts/jev-loop.test.ts
```

## Inspect a run

The script prints its Endform results folder (`test-results/live-session-<session-id>/`). It contains:

- `screenshots/00-initial.png`, numbered `NN-after.png` images after each action, wait, or rejection, and a final `NN-verified-after-reload.png` on success. The initial image is the state for decision 1; each after-image is the state for the next decision.
- `step-NN-choices.json`: all candidates, answer probabilities, execution judgment, and action result.
- `jev-cost.json`: API-reported token totals, model revisions, and the estimated Jev cost.
- Endform's automatically saved `run-*-ai-aria-snapshot.yml` files.

Endform captures ARIA snapshots automatically after commands (including failures). The CLI saves them but only prints the command's stdout/stderr, so the controller reads the newly saved snapshot instead of calling `page.ariaSnapshot()` again. Screenshots are **explicit**: the controller calls `page.screenshot()` in the worker's current directory, and Endform transfers the new PNG back automatically. The controller groups copies under `screenshots/`. Screenshots and snapshots are sequential observations, not an atomic capture of an animating page. Capturing screenshots also adds latency to the loop.

Cost is estimated at $0.042 per million input tokens and $0 for output tokens, using [TypeSafe's published pricing](https://typesafe.ai/blog/introducing-system-one-models-and-jev), checked September 22, 2026. Both selection/completion requests and execution-gate requests count. Missing usage (including failed API requests) is flagged as a partial estimate. This estimates Jev API charges only, excluding Endform/browser infrastructure, and is not an invoice.
