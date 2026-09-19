import type { TicketType } from "./types";

/**
 * A blank box produces inconsistent tickets. Scaffolding the shape a reader
 * needs is the cheapest data-quality fix there is.
 */
export const TEMPLATES: Partial<Record<TicketType, string>> = {
  bug: `What happens
Describe the behaviour you saw.

What you expected
Describe what should have happened instead.

Steps to reproduce
- 
- 
- 

Evidence
\`\`\`
paste logs or a stack trace here
\`\`\``,
  incident: `Impact
Who is affected and how badly.

Timeline
- Detected:
- Mitigated:
- Resolved:

Current status
What is happening right now.

Follow-up
- `,
  request: `What you need
Describe the access, hardware or change you are asking for.

Why
What it unblocks.

Approval
Who needs to sign this off.`,
  feature: `Problem
What is not possible today.

Proposal
How this should work.

Acceptance criteria
- 
- 

Out of scope
- `,
  epic: `Outcome
What is true when this is finished.

Why now
- 

Not included
- `,
};
