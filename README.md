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
- Light theme only. See [DESIGN.md](./DESIGN.md) for the token system.

## Screens

| Route | What it is |
| --- | --- |
| `/` | Overview: my KPIs, my team's KPIs, and a card per project I work on |
| `/my-work` | Assigned to me and My team on one page, with KPIs that filter it |
| `/boards` | Every board, with its column distribution |
| `/projects` | All projects with stats, lead and members |
| `/projects/[key]/board` | Kanban with drag and drop, filters and group-by |
| `/projects/[key]/list` | Sortable, filterable, virtualized table |

The ticket detail panel opens over any of them.

**Filters live in the URL**, so any view is a link you can paste to someone.
Saved views pin a filter combination into the sidebar.

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
