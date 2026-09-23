# UNI Tickets — UI prototype

A ticketing app (Jira/Monday style) built as a front-end prototype: no backend,
no database, no auth. Every screen reads from `src/lib/mock`, and interactions
such as moving a card or posting a comment mutate local state.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Node 18.18+ required.

## Stack

- Next.js (App Router) · TypeScript · Tailwind v4
- shadcn/ui as the only base component system, vendored into
  `src/components/ui` so every component is editable in-repo
- Dark theme. See [DESIGN.md](./DESIGN.md) for the token system.

## Screens

| Route | What it is |
| --- | --- |
| `/` | Overview: my KPIs, my team's KPIs, and a card per project I work on |
| `/my-work` | Assigned to me and My team on one page, with KPIs that filter it |
| `/boards` | Every board, with its column distribution |
| `/insights` | Cycle time, throughput and where work is stuck |
| `/projects` | All projects with stats, lead and members |
| `/projects/[key]/board` | Kanban with drag and drop, filters and group-by |
| `/projects/[key]/list` | Sortable, filterable, virtualized table |

The ticket detail panel opens over any of them.

## Backend API

The development server exposes a small persistence-backed API. On first
request it seeds `.data/uni-ticket.json` from the deterministic prototype
dataset; subsequent writes survive server restarts. The data file is ignored
by git.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/workspaces` | List workspaces |
| `GET` | `/api/projects` | List projects |
| `GET` | `/api/tickets` | List tickets; supports `projectId`, `status` and `assigneeId` |
| `POST` | `/api/tickets` | Create a ticket with validated input |
| `GET` | `/api/tickets/:id` | Fetch a ticket by ID or human key |
| `PATCH` | `/api/tickets/:id` | Update mutable ticket fields |

The backend uses PostgreSQL through Prisma. Copy `.env.example` to `.env`,
start PostgreSQL, then run `npm install`, `npm run db:generate`,
`npm run db:migrate -- --name init`, and `npm run db:seed`.

Authentication, authorization, file storage, and rate limiting are intentionally
separate production milestones; the service layer is the boundary where those
policies should be added before exposing the API publicly.

**Filters and the open ticket live in the URL**, so any view — and any single
ticket, `?ticket=APO-142` — is a link you can paste to someone. Browser back
closes the panel. Saved views pin a whole view, including scope, grouping and
density, into the sidebar.

Search takes operators alongside free text, in both the list and ⌘K:
`assignee:me`, `is:open`, `is:blocked`, `status:review`, `severity:s1`,
`type:bug`, `label:api`.

## Shortcuts

| Key | Does |
| --- | --- |
| `⌘K` | Command palette — search tickets, jump to a board |
| `C` | New ticket |
| `⌘B` | Toggle the sidebar |
| `J` / `K` | Move down / up the list |
| `Enter` | Open the ticket under the cursor |
| `X` | Select it, for bulk actions |
| `Esc` | Close the panel |

## Personas

Ticket types carry the fields their persona needs rather than one flat shape:

- **Bugs and incidents** — severity (separate from priority), environment,
  build version, attachments.
- **Anything with code behind it** — linked branch, PR number, PR state and CI
  status.
- **Service desk requests** — a requester who is not on the team, and an SLA
  target derived from severity.

## Workflow

Backlog → To Do → In Progress → In Review → **Ready for QA** → **Verified**.
"Done" used to mean a developer thought it was finished; now a ticket is only
closed once someone verifies it, and anything verified can be reopened.

Tickets carry epics (parent/child), blocks / blocked-by / relates-to /
duplicates links, and sprints. Boards enforce WIP limits and can be split into
swimlanes.

Project roles are admin, member and viewer. The current user is a viewer on
Helpdesk, so that project is read-only — which is the quickest way to see
permissions working.

## Layout

```
src/
  app/(app)/          routes, all wrapped in the navigation shell
  components/shell/   app rail, section sidebar, page header
  components/ui/      shadcn/ui primitives
  lib/mock/           the dataset: projects, users, tickets, comments
  components/shared/  empty states and skeletons
  lib/store/          client state — drag and drop, comments, panel
```

## Mock data

Generated from one seeded PRNG, so it is identical on every render: 5 projects,
8 users, 168 tickets and 232 comments. Dates are offsets from the build date
rather than fixed timestamps, so tickets stay genuinely overdue and recently
updated however long after the build you open it.

## Deploying

`npm run build` produces a normal Next.js build. Setting `GITHUB_PAGES=true`
switches it to a static export in `out/`, which is what the Pages workflow in
`.github/workflows/` publishes.
