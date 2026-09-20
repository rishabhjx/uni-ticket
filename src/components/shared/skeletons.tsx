import { cn } from "@/lib/utils";

function Bar({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn("animate-pulse rounded-md bg-grey-150", className)}
    />
  );
}

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-md border border-grey-200 p-4"
        >
          <Bar className="h-3 w-20" />
          <Bar className="h-7 w-12" />
          <Bar className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * The widths below are the real columns, not decoration: a skeleton whose
 * bars do not land where the content lands is a picture of a different page.
 */
export function RowsSkeleton({ rows = 10 }: { rows?: number }) {
  const titles = ["72%", "48%", "86%", "60%", "38%", "78%"];
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex h-row items-center gap-4 border-b border-grey-150 px-4"
        >
          <Bar className="size-4 rounded-[4px]" />
          <Bar className="size-3.5" />
          <Bar className="h-3 w-14" />
          <div className="min-w-0 flex-1">
            <Bar className="h-3" style={{ width: titles[index % titles.length] }} />
          </div>
          <Bar className="h-4 w-20 shrink-0" />
          <Bar className="h-4 w-16 shrink-0" />
          <div className="flex w-32 shrink-0 items-center gap-2">
            <Bar className="size-5 rounded-full" />
            <Bar className="h-3 flex-1" />
          </div>
          <Bar className="h-3 w-12 shrink-0" />
          <Bar className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/**
 * The bar is real furniture, not content: it is there before the tickets are
 * and it does not move when they arrive. Drawing its shape during the load is
 * the difference between a page settling and a page jumping.
 */
export function FilterBarSkeleton({ extra = 3 }: { extra?: number }) {
  return (
    <div className="hairline-b flex shrink-0 items-start gap-2 px-4 py-2.5 sm:px-6">
      <Bar className="h-7 w-64 shrink-0" />
      <Bar className="h-7 w-32 shrink-0" />
      <div className="ml-auto flex items-center gap-2">
        {Array.from({ length: extra }, (_, index) => (
          <Bar key={index} className="size-7" />
        ))}
        <Bar className="h-7 w-20" />
      </div>
    </div>
  );
}

/**
 * Matched to the real board rather than to a generic three-bar card: the same
 * six columns, the same card anatomy (key row, title, badge row, footer), and
 * -- the one that actually caused visible reflow -- columns sized to their
 * content instead of running to the bottom of the viewport.
 */
export function BoardSkeleton({ columns = 6 }: { columns?: number }) {
  const cards = [4, 3, 4, 2, 3, 2];
  return (
    <>
      <FilterBarSkeleton />
      <div className="flex flex-1 gap-3 overflow-hidden px-6 py-4">
        {Array.from({ length: columns }, (_, column) => (
          <div
            key={column}
            className="flex min-w-[268px] flex-1 shrink-0 flex-col self-start rounded-md border border-grey-200 bg-grey-50"
          >
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-grey-200 px-3">
              <Bar className="h-3 w-20" />
              <Bar className="h-3 w-4" />
            </div>
            <div className="flex flex-col gap-2 p-2">
              {Array.from({ length: cards[column % cards.length] }, (_, card) => (
                <div
                  key={card}
                  className="flex flex-col gap-2 rounded-md border border-grey-200 bg-grey-0 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Bar className="size-3.5" />
                    <Bar className="h-3 w-16" />
                    <Bar className="ml-auto h-4 w-20" />
                  </div>
                  <Bar className="h-3 w-full" />
                  <div className="flex items-center gap-1.5">
                    <Bar className="h-4 w-16" />
                    <Bar className="h-4 w-12" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Bar className="h-3 w-12" />
                    <Bar className="ml-auto size-5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function CardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-3 px-6 py-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-md border border-grey-200 p-4"
        >
          <Bar className="h-4 w-32" />
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * The whole shell as a skeleton. ViewStateProvider reads the URL, so the
 * prerendered HTML for every route is this, and the real UI renders on the
 * client — which is the same loading model the store already uses.
 */
export function AppShellSkeleton() {
  return (
    <div className="flex h-full">
      <div className="hairline-r flex w-rail shrink-0 flex-col items-center gap-1 bg-grey-100 py-3">
        <Bar className="mb-2 size-8" />
        {Array.from({ length: 11 }, (_, index) => (
          <Bar key={index} className="size-9 bg-grey-150" />
        ))}
      </div>
      <div className="hairline-r flex w-sidebar shrink-0 flex-col gap-2 bg-grey-50 p-3">
        <Bar className="mb-2 h-5 w-24" />
        <Bar className="h-8 w-full" />
        {Array.from({ length: 8 }, (_, index) => (
          <Bar key={index} className="h-7 w-full" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hairline-b flex h-topbar shrink-0 items-center px-6">
          <Bar className="h-6 w-40" />
        </div>
        <RowsSkeleton rows={14} />
      </div>
    </div>
  );
}
