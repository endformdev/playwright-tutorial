# Blog outline: Using Jev to dynamically run Playwright tests

Draft brief for the writing team. Branch: `oliver/jev-test-loop`. Use **Jev**, **Playwright**, and **Endform** consistently throughout.

## Title options

- **Using Jev to Dynamically Run Playwright Tests** — recommended; clear and direct.
- **Can Jev Choose the Next Step in a Playwright Test?**
- **Jev Meets Playwright: Cheap Decisions, Tricky Tests**
- **We Let Jev Drive Playwright: What Worked and What Stalled**
- **150 Attempts with Jev and Playwright: The Promise and the Limits**

## Editorial direction

- An honest engineering experiment: can a classifier choose browser actions from a goal and the current page?
- Lead with the contrast in the results: excellent performance on narrow observation checks, some success with simple changes, substantial difficulty elsewhere, and very low model costs.
- This is a deliberately naive implementation, not a verdict on Jev's capabilities or a production-ready testing framework.
- Compare outcomes across converted scenarios. We did not run a controlled speed or cost comparison against ordinary Playwright or a generative browser agent.

## 1. Introduction: let Jev choose what Playwright does next

- We used Jev to select and execute steps dynamically inside Playwright tests, then measured success, duration, and model cost.
- Starting point: an existing tutorial suite with known workflows, fixtures, and expected outcomes.
- Hook: 150 attempts cost approximately **$0.19 in Jev usage**, but only **50 passed verification**. The interesting story is which tests worked and why the others struggled.
- Preview the question: could instructions such as “fill out this form with these details” replace some hand-written interaction code while retaining the test harness?

## 2. Why a classifier inside a test runner?

- Introduce Jev as a classifier: in this experiment it chooses among supplied actions and scores yes/no questions. It does not generate arbitrary Playwright code.
- Distinguish one-time AI conversion of existing tests into frozen text specifications from the runtime loop. No generative model writes steps during execution.
- Keep Playwright fixtures and the harness: create an isolated user, establish a logged-in session, control the browser, verify outcomes, and clean up.
- Hypothesis: some interactions could be described by intent and supplied data, with Jev selecting the concrete action at runtime.
- The experiment tests that division of responsibility; it does not eliminate authored test expectations or setup code.

## 3. The approach: a Bun script, Endform live test, and a decision loop

- Introduce Endform live-test functionality: start a Playwright session and issue commands into the running browser while retaining its state and fixtures.
- Each scenario supplies a frozen aim, input values, and success criteria. The controller is a Bun script calling the Endform CLI and Jev API.
- Decision-loop diagram ([editable Excalidraw source](./diagrams/jev-playwright-loop.excalidraw), [SVG](./diagrams/jev-playwright-loop.svg)):

  ![Jev selects from candidate actions built from the aim and current accessibility snapshot. A separate execution gate allows a Playwright action, then a fresh snapshot feeds the next iteration. Completion claims go to independent Playwright checks.](./diagrams/jev-playwright-loop.svg)

- Endform automatically saves an AI accessibility snapshot after commands. The controller reads it and maps element references to concrete Playwright locators.
- Build click, fill, and check choices, plus navigation, wait, and stop options. In the naive version, every supplied input value can be paired with every textbox.
- Send the aim, criteria, URL/title, snapshot, candidates, and the last five action observations to Jev. Ask which action to take and whether the task is complete; use a separate request to judge whether the chosen action should execute.
- Completion threshold: 0.90. Execution threshold: 0.80. These are experimental settings, not calibrated reliability guarantees.
- End on a verified completion, an explicit stop, repeated unchanged state/action, a limit, or an error. Benchmark limits: 30 iterations and seven minutes after startup.
- Independent Playwright assertions check completion claims; they do not guide action selection. They are adapted checks, not proof of equivalence with every original assertion.
- Screenshots are explicitly captured by our controller and transferred back by Endform. They are inspection artifacts; Jev receives text, not images. Preserve this distinction from the automatic snapshots.

## 4. Converting the tutorial suite and measuring it

- Convert all 15 listed tests into frozen scenarios, adapting signup/setup and deletion/teardown to isolated accounts. Run each ten times: **150 attempts**, with three concurrent sessions.
- Track verified success, explicit stop, repeated-state stall, and infrastructure/API errors, alongside duration and reported token usage.
- Use the full per-test table from [BENCHMARK_RESULTS.md](./BENCHMARK_RESULTS.md); a grouped chart can introduce it:

| Scenario group | Verified successes | What it suggests |
|---|---:|---|
| Observation checks: title, activity section, logged-in state | 29/30 | Strong performance when the required evidence is already visible |
| Signup, name change, activity after an update | 21/30 | Promising but inconsistent on short interaction flows |
| Remaining nine scenarios | 0/90 | This implementation struggled with longer flows, ambiguity, and completion decisions |

- Overall: **50/150 (33.3%)** verified success; **73 stalls**, **25 explicit stops**, **2 HTTP 529 errors**.
- Mean duration: **21.7 seconds per attempt**, including session startup, screenshots, verification, and cleanup. Fast failed attempts are not evidence of fast successful execution.
- Estimated Jev cost: **$0.190714 total**, **$0.001271 per attempt** (about 0.127 US cents). Includes failed attempts; excludes browser/Endform infrastructure, development, and one-time specification generation. Two failed API responses had no reported usage.
- Ten attempts per scenario provide exploratory evidence, not a precise reliability estimate. Pricing is the rate recorded for this experiment; link the pricing source in the results/README and verify it before publication.

## 5. What worked, what sometimes worked, and what never passed

### Consistently strong: evidence already on the page

- Title and activity-section checks: **10/10** each. Logged-in state: **9/10**.
- Little navigation, few ambiguous choices, and success evidence available directly in the observation.
- This supports a narrow claim about this suite's observation tasks; these are also relatively easy tasks.

### Partial success: short visible changes

- Signup: **8/10**; activity after account update: **7/10**; name change: **6/10**.
- Traces show inconsistent completion judgments and action/gate disagreement. A viable next action can be selected and then rejected, leaving the browser unchanged.
- Explain one successful and one stalled name-change run to make the loop concrete. Choose actual artifacts rather than inventing dialogue or model reasoning.

### Zero verified successes: several different kinds of failure

- List the nine cases: activity ordering, email change, password change, duplicate invitation, payment history, plan upgrade, sign-out, team invitation, and account deletion.
- Group observed contributing factors rather than attributing every failure to a single cause:
  - Ambiguous descriptions: identical “Get Started” choices without useful ancestor context; user-menu buttons identified by initials.
  - Too many poorly distinguished actions: checkout produced 88 candidates from pairing values with fields; premature submission also occurred.
  - Longer workflows: navigation, account transitions, and limited history make progress and completion harder to establish.
  - Completion false negatives: deletion appeared to complete, but scores below 0.90 prevented verified success. Zero benchmark passes does not always mean zero useful browser actions.
- Present these as observations and plausible contributors. We did not run ablations proving how much each change would improve results.

## 6. Injecting failures: did the tests stop and fail?

- Inject faults into scenarios that otherwise passed to see whether the loop stops when the expected outcome is broken.
- Sometimes Jev stopped correctly; sometimes it stalled on an unchanged state until the controller ended the run.
- The correct stops are encouraging. The stalls are a weakness: the test ends without success, but does not clearly recognize or explain what went wrong.
- Takeaway: the loop showed some useful failure handling, but getting stuck is not the same as detecting a failure cleanly.

## 7. What the naive approach teaches us

- There are two lossy transformations: **web page → accessibility representation → finite action menu**.
- The first can omit visual relationships and application state; the second can discard context, collapse meaningful distinctions, and introduce implausible choices.
- Jev must classify the representation we supply. Missing information or poorly constructed candidates cannot be repaired merely by choosing a label.
- Our gate design, short history, and fixed thresholds add further limitations. Avoid implying all failures are inherent to classifiers.
- Possible follow-up experiments: preserve ancestor context, associate values with fields, represent progress explicitly, and simplify or calibrate the execution gate. Clearly label these as untested ideas.

## 8. Conclusion: cheap enough to explore, selective enough to be useful

- Return to the evidence: very strong on narrow checks, mixed on simple mutations, unsuccessful on the remaining scenarios in this implementation.
- The measured model cost makes repeated dynamic decisions inexpensive enough to investigate in bounded parts of a conventional Playwright suite. We have not established comparative savings against another agent.
- Third-party forms, such as Stripe checkout, are a possible future use case: retain deterministic setup/assertions and delegate a bounded interaction. **Our checkout scenarios failed, and we did not demonstrate successful Stripe automation**; present this as a hypothesis that needs better representations and validation.
- Close with an invitation: “Where would a small, dynamic step help in your Playwright tests? We'd be curious to hear which parts of testing your own web applications would suit this approach.”

## Handoff references

- [Benchmark results](./BENCHMARK_RESULTS.md): per-test numbers, fault outcomes, and artifact paths.
- [Runner documentation](./README.md): operation, screenshots, snapshots, and cost assumptions.
- [Benchmark controller](../jev-benchmark.ts), [frozen scenarios and verification](./cases.ts), and [Playwright harness](./suite-harness.spec.ts).
- Raw benchmark folders and screenshots are Git-ignored and contain local paths. Sharing the branch alone will not give the writing team those artifacts; export selected runs separately if illustrations are needed.
- Keep the distinction between measured results, trace-based explanations, and proposed improvements throughout. Do not claim general production readiness, a head-to-head benchmark, or reliable fault detection.
