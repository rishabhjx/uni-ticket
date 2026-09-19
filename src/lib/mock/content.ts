import type { TicketType } from "./types";

/** Opening context for a ticket description, chosen by type. */
export const summariesByType: Record<TicketType, string[]> = {
  bug: [
    "Reported by support after four accounts hit this in the last week. Reproduced on staging with a clean account.",
    "Regression — this did not happen before the previous release. Bisecting narrowed it to the deploy on the 14th.",
    "Intermittent, roughly one request in fifty. Logs from the linked incident are attached below.",
    "Only reproduces with a tenant that has more than 10,000 records, which is why it escaped review.",
    "Found during the release candidate sweep. Not customer-visible yet, but it will be once 4.3 ships.",
  ],
  feature: [
    "Asked for repeatedly in customer calls and currently blocking two enterprise deals this quarter.",
    "Part of the platform hardening track. Should ship behind a flag and roll out tenant by tenant.",
    "The current workaround is a manual process the support team runs by hand roughly twice a week.",
    "Agreed in the quarterly planning review. Design is signed off; the API shape is still open.",
    "Unblocks the migration work in the next quarter, so it wants to land before the code freeze.",
  ],
  task: [
    "Groundwork for the wider migration. No user-visible change expected, but it touches a lot of call sites.",
    "Carved out of the larger epic so it can be reviewed and rolled back on its own.",
    "Has been on the backlog since the last incident review, where it came up as a contributing factor.",
    "Needs a maintenance window if we take the straightforward path; otherwise it is a two-phase rollout.",
    "Straightforward once the dependency lands. Worth doing while the surrounding code is fresh.",
  ],
  chore: [
    "Housekeeping. Low risk, but it keeps biting new joiners during onboarding.",
    "Picked up from the last tidy-up sprint. No urgency, but it is cheap to do now.",
    "Documentation debt — the current page describes behaviour we changed two quarters ago.",
    "Small and self-contained. Good first ticket for someone new to this area of the codebase.",
    "Follow-up from the audit. Nothing is broken today; this keeps it that way.",
  ],
};

/** Acceptance criteria, chosen by type. */
export const criteriaByType: Record<TicketType, string[]> = {
  bug: [
    "A regression test covers the failing case",
    "The fix is verified on staging with a production-shaped dataset",
    "Root cause is written up on the incident record",
    "Affected customers are identified and notified",
    "Monitoring alerts if this recurs",
  ],
  feature: [
    "Behaviour is behind a feature flag, defaulting off",
    "The public API reference is updated",
    "Covered by integration tests for the happy and failure paths",
    "Design review signed off by the design lead",
    "Rollout plan agreed with the on-call engineer",
  ],
  task: [
    "No change in behaviour for existing callers",
    "Rollback path documented in the PR description",
    "Benchmarks recorded before and after",
    "All call sites migrated; the old path is removed",
    "Runbook updated for the on-call rotation",
  ],
  chore: [
    "The change is reviewed by an owner of this area",
    "Docs updated in the same pull request",
    "Linting or CI enforces this going forward",
    "No new dependencies introduced",
    "Linked from the team handbook",
  ],
};

/** Comment bodies. Deliberately generic so they read naturally on any ticket. */
export const commentBodies: string[] = [
  "Reproduced on staging — it only happens when the request crosses a region boundary.",
  "I pushed a fix behind a flag. Can someone sanity-check the rollout plan before I enable it?",
  "Do we have a customer impact estimate? That changes whether this is a hotfix or waits for the release.",
  "This overlaps with the work in the platform epic. Worth pairing for half an hour before we split it.",
  "Taking this one. Should have something reviewable by tomorrow afternoon.",
  "Bumping priority — a second customer hit this overnight and support had to intervene manually.",
  "The tricky part is the migration, not the change itself. We need a two-phase rollout.",
  "Added a regression test that fails on main and passes with the fix.",
  "I don't think this is worth doing until the dependency lands. Moving it back to the backlog for now.",
  "Left a few comments on the PR — mostly naming, one real question about the error path.",
  "Confirmed fixed on the release candidate. Closing once it reaches production.",
  "Can we scope this down? The first two acceptance criteria deliver most of the value.",
  "Design is signed off. The remaining question is what happens on the empty state.",
  "Heads up: this touches the shared client, so it will need review from the platform team too.",
  "Numbers from staging: p99 went from 340ms to 120ms. Good enough to ship.",
  "Blocked on access to the staging environment — raised a request, should be sorted tomorrow.",
  "I'd rather not special-case this. If we do, we own the branch forever.",
  "Splitting this into two tickets so the risky half can ship separately.",
  "Verified on both iOS 17 and 18. Android still needs a pass.",
  "This has been open for a while. Still relevant, or should we close it?",
  "Good catch. The same bug exists in the batch path — worth fixing both together.",
  "Rolled back — it caused a spike in 5xx on the gateway. Investigating now.",
  "Re-enabled at 10% of traffic this morning and it looks stable.",
  "Documented the new behaviour in the handbook and linked it from the runbook.",
  "The estimate feels low. There are more call sites than the description suggests.",
  "Moved to In Review. One approval and it can go out with the Thursday release.",
  "Talked to the customer directly — their workaround is fine for another week.",
  "Agreed on the approach in standup. I'll write it up here so it isn't lost.",
  "Adding the accessibility label fixed VoiceOver, but the focus order is still wrong.",
  "Closing as duplicate of the other ticket in this project — the discussion continues there.",
];
