"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/tickets/user-avatar";
import {
  DISCIPLINES,
  DISCIPLINE_LABEL,
  getUser,
  type Discipline,
} from "@/lib/mock";

/**
 * Who picks a ticket up at each stage, overriding the project's own routing
 * for this ticket only. Every row can be left on "Project default" — the
 * common case — or pinned to someone specific, e.g. a bug that must go back
 * to the person who wrote the code rather than whoever owns QA this sprint.
 */
export function StageAssigneesEditor({
  value,
  onChange,
  memberIds,
  /** The project's own `team`, shown as each row's default. */
  projectTeam,
  className,
}: {
  value: Partial<Record<Discipline, string>>;
  onChange: (next: Partial<Record<Discipline, string>>) => void;
  memberIds: string[];
  projectTeam?: Partial<Record<Discipline, string>>;
  className?: string;
}) {
  return (
    <div className={className ?? "flex flex-col gap-1.5"}>
      {DISCIPLINES.filter((discipline) => discipline !== "closed").map(
        (discipline) => {
          const picked = value[discipline];
          const fallback = projectTeam?.[discipline];
          const fallbackName = fallback
            ? (getUser(fallback)?.name ?? fallback)
            : "Nobody";

          return (
            <div
              key={discipline}
              className="grid grid-cols-[96px_1fr] items-center gap-2"
            >
              <span className="text-small text-grey-600">
                {DISCIPLINE_LABEL[discipline]}
              </span>
              <Select
                value={picked ?? "default"}
                onValueChange={(next) =>
                  onChange({
                    ...value,
                    [discipline]: next === "default" ? undefined : next,
                  })
                }
              >
                <SelectTrigger className="h-7 text-small">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    <span className="text-grey-500">
                      Project default · {fallbackName}
                    </span>
                  </SelectItem>
                  {memberIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      <span className="flex items-center gap-2">
                        <UserAvatar userId={id} />
                        {getUser(id)?.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        },
      )}
    </div>
  );
}
