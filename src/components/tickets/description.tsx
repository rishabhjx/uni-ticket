import { cn } from "@/lib/utils";

/**
 * Descriptions are plain text with "- " bullet runs and ``` fences. Any
 * technical user pastes a stack trace into the first ticket they file, so
 * fenced blocks render as monospace instead of collapsing into prose.
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
  let code: string[] = [];
  let inCode = false;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="flex flex-col gap-1 pl-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-body text-grey-700">
            <span
              aria-hidden
              className="mt-[7px] size-1 shrink-0 rounded-full bg-grey-400"
            />
            {item}
          </li>
        ))}
      </ul>,
    );
  };

  const flushCode = () => {
    if (code.length === 0) return;
    const lines = code;
    code = [];
    blocks.push(
      <pre
        key={`pre-${blocks.length}`}
        className="overflow-x-auto rounded-md bg-grey-50 p-3 font-mono text-[12px] leading-[18px] text-grey-800"
      >
        <code>{lines.join("\n")}</code>
      </pre>,
    );
  };

  for (const line of text.split("\n")) {
    if (line.trim().startsWith("```")) {
      if (inCode) flushCode();
      else flushBullets();
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      bullets.push(trimmed.slice(2));
      continue;
    }
    flushBullets();
    if (!trimmed) continue;

    const isHeading = trimmed.length < 40 && !/[.:!?]$/.test(trimmed);
    blocks.push(
      isHeading ? (
        <p
          key={`h-${blocks.length}`}
          className="text-body font-semibold text-grey-900"
        >
          {trimmed}
        </p>
      ) : (
        <p
          key={`p-${blocks.length}`}
          className="text-body text-grey-700"
        >
          {trimmed}
        </p>
      ),
    );
  }
  flushBullets();
  flushCode();

  return <div className={cn("flex flex-col gap-3", className)}>{blocks}</div>;
}
