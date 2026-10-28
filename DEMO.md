Prompt 1:

You're testing a web app by hand, using your browser tool. Don't write any code.

App: https://deploy-preview-10--endform-playwright-tutorial.netlify.app

1. Go to `/sign-up` and create an account with a made-up email like `demo-<random>@example.com` and the password `testpassword123`.
2. On the Team Settings page (`/dashboard`), invite a teammate using another made-up email, with the Member role, and wait for "Invitation sent successfully".
3. Open the Activity page from the sidebar.
4. Check that the newest (top) entry says "You invited a team member".

Report PASS or FAIL. Describe exactly what you saw at each step, including the full list of entries on the Activity page.

Prompt 2:

In this repo (branch `demo/invite-activity-after-response`), write a new Playwright test at `tests/team-invite-activity.live.spec.ts`. Explore the app first, using existing tests and functionality through an endform live test.

- Start a session inside an existing test that already has a logged-in new user: `tests/duplicate-invite.spec.ts` or similar using endform live test.
- Step through the scenario one action at a time. To expore and figure out which playwright code makes sense for the test.
  - invite a teammate from the Team Settings page (`/dashboard`);
  - wait for "Invitation sent successfully";
  - open the Activity page from the sidebar;
  - check that the newest entry is "You invited a team member".
- Once every step has worked live, stop the session and create a nice new playwright test for this flow.
- Follow the suite's conventions: the `testWithNewUser` fixture from `tests/test-with-new-user.ts`, `test.step` blocks, role-based locators, and a unique invite email per run.
- Finish by running it once with `npx endform test team-invite-activity.live`.

Next commands:

p playwright test team-invite-activity --debug --no-deps

p endform test team-invite-activity --repeat-each=100 --no-deps

Then ask:

look at `team-invite-activity` playwright/endform runs from the last hour. What's the pass rate, and what's the most common failure? Is it a bug in the app or noise in the test?
