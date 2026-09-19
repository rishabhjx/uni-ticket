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

## Layout

```
src/
  app/(app)/          routes, all wrapped in the navigation shell
  components/shell/   app rail, section sidebar, page header
  components/ui/      shadcn/ui primitives
  lib/mock/           the dataset: projects, users, tickets, comments
  lib/store/          client state — drag and drop, comments
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
