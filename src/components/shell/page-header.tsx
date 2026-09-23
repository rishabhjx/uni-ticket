"use client";

/**
 * A slim title row for the top-level pages. It used to carry the sidebar
 * toggle, the search box and the New menu; all three moved to TopNav when the
 * sidebar went, which left this doing the one job a page header should: name
 * the page and hold the actions that belong to it.
 *
 * Project views do not use it — the breadcrumb in TopNav already names the
 * project, and a second row repeating it is a row of nothing.
 */
export function PageHeader({
  title,
  icon,
  meta,
  actions,
}: {
  title: string;
  /** An entity tile or icon shown before the title, e.g. a workspace's. */
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="glass hairline-b relative z-10 flex h-topbar shrink-0 items-center gap-3 px-4 sm:px-6">
      {icon}
      <h1 className="text-title font-semibold text-grey-900">{title}</h1>
      {meta}
      {actions ? (
        <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
