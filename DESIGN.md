# Design system — UNI Tickets

Light theme only. No dark mode, no theme toggle. Every screen uses one font,
one spacing scale, one border-radius. Colour is reserved for status and
priority badges plus a single accent.

## Type — Inter, five steps

| Token | Size / line | Use |
| --- | --- | --- |
| `text-metric` | 28 / 34, −0.02em | KPI numbers only |
| `text-title` | 20 / 28, −0.014em | Page title (one per screen) |
| `text-heading` | 15 / 20, −0.006em | Section headings, ticket titles |
| `text-body` | 14 / 20 | Default body, table cells, inputs |
| `text-small` | 13 / 18 | Metadata, secondary text |
| `text-caption` | 12 / 16, +0.02em | Column headers, labels, badges |

Weights: 400 / 500 / 600. Nothing heavier. `tabular-nums` is on globally for
tables, KPIs and ticket keys so columns of figures line up.

## Colour

Neutral ramp `--grey-0 … --grey-900` carries the entire interface — surfaces,
text, borders, hover states.

One accent, `--accent-600` (#1f5fdb): active nav item, primary button, focus
ring, selected row. Nowhere else.

Status and priority are the only other colour, and only inside badges:

| Status | Priority |
| --- | --- |
| Backlog · grey | Urgent · red |
| To Do · slate | High · orange |
| In Progress · blue | Medium · amber |
| In Review · violet | Low · slate |
| Done · green | |

Each badge is a tinted background + darker foreground of the same hue, and is
always paired with its text label — colour never carries meaning alone.

## Spacing — 4px base

Used: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Nothing off the scale.

Layout metrics: app rail 56px · section sidebar 248px · top bar 52px ·
table row 44px · ticket panel 460px.

## Radius — 8px, one value

`--radius: 8px`. Every shadcn size alias (`xs`…`xl`) is collapsed onto it so
any component added later lands on the system automatically.

## Elevation — effectively none

Separation is done with 1px hairlines (`--border`, #e2e2e5), not shadows.
Tailwind's `shadow-*` utilities are mapped to `none`. Two exceptions exist,
both functional: `--shadow-overlay` for popovers/dropdowns/the ticket panel,
and `--shadow-drag` for a card while it is being dragged.

## Motion

Short, functional, ≤150ms: hover tints, panel slide-in, drag transforms.
`prefers-reduced-motion` disables all of it.
