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

One easing curve, `cubic-bezier(0.32, 0.72, 0, 1)`, applied to every
transition in the product so nothing feels quicker or slower than the thing
beside it. Three durations: `--duration-instant` 100ms for presses and
overlays appearing, `--duration-fast` 150ms as the default, `--duration-slow`
220ms for the sidebar and the ticket panel, which travel further.

Components opt into a different length; none opt into a different curve.
`prefers-reduced-motion` disables all of it.

## Glass

Only surfaces that *float over* content use it, and only to say "your work is
still underneath": the ticket panel, the command palette, the bulk action bar,
the page and table headers that content scrolls under, and the menus.

Never on cards, rows or KPI tiles. People read those all day, and translucency
costs them contrast for nothing.

`--glass-bg` holds an opacity floor of 0.86 so text stays legible, and
`saturate(180%)` stops the blur washing the colour out of what shows through.
A `@supports` fallback makes it opaque where `backdrop-filter` is unavailable.
Measured against the 104-row virtualized table in a production build: 32fps
with the blurred sticky header and 32fps without, so it costs nothing here.

## Emoji

Used in four places and no more: project identity (faster to recognise than a
two-letter tile), empty states, comment reactions, and the moment work is
finished. Never on status, priority, severity or in table cells — the data has
to stay scannable.

## Colour, revisited

The original rule reserved colour for status and priority badges. Two
exceptions were added after reviewing the build:

- **Overdue and SLA breaches** use the red tint. A date you have already
  missed is exactly the kind of meaning colour exists for, and in grey it was
  unfindable on a board of 100 cards.
- **Severity S1 and S2** use red and orange. S3 and S4 stay neutral, so the
  serious defects are the ones that stand out.
