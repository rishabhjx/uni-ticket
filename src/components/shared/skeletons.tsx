import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-grey-150", className)} />
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

export function RowsSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex h-row items-center gap-3 border-b border-grey-150 px-6"
        >
          <Bar className="h-3 w-16" />
          <Bar className="h-3 flex-1 max-w-sm" />
          <Bar className="ml-auto h-4 w-16" />
          <Bar className="h-4 w-16" />
          <Bar className="size-5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex h-full gap-3 overflow-hidden px-6 py-4">
      {Array.from({ length: 5 }, (_, column) => (
        <div
          key={column}
          className="flex w-[300px] shrink-0 flex-col gap-2 rounded-md border border-grey-200 bg-grey-50 p-2"
        >
          <Bar className="mb-1 h-3 w-24" />
          {Array.from({ length: 4 - (column % 2) }, (_, card) => (
            <div
              key={card}
              className="flex flex-col gap-2 rounded-md border border-grey-200 bg-grey-0 p-3"
            >
              <Bar className="h-3 w-16" />
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ))}
    </div>
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
