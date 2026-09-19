import { cn } from "@/lib/utils";

/**
 * Mock descriptions are plain text with the occasional "- " bullet run.
 * Rendering those as a real list reads far better than a pre-wrapped blob.
 */
export function Description({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="flex flex-col gap-1 pl-1">
        {bullets.map((item) => (
          <li key={item} className="flex gap-2 text-small text-grey-700">
            <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-grey-400" />
            {item}
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      bullets.push(trimmed.slice(2));
      continue;
    }
    flushBullets();
    if (!trimmed) continue;
    // A short line with no trailing punctuation is a heading in this data.
    const isHeading = trimmed.length < 40 && !/[.:!?]$/.test(trimmed);
    blocks.push(
      isHeading ? (
        <p key={`h-${blocks.length}`} className="text-small font-medium text-grey-900">
          {trimmed}
        </p>
      ) : (
        <p key={`p-${blocks.length}`} className="text-small leading-[20px] text-grey-700">
          {trimmed}
        </p>
      ),
    );
  }
  flushBullets();

  return <div className={cn("flex flex-col gap-3", className)}>{blocks}</div>;
}
