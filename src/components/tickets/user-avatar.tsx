import { getUser, type User } from "@/lib/mock";
import { cn } from "@/lib/utils";

/** Avatars stay greyscale — four neutral steps keep eight people distinguishable. */
const toneClass: Record<User["tone"], string> = {
  0: "bg-grey-200 text-grey-700",
  1: "bg-grey-300 text-grey-800",
  2: "bg-grey-150 text-grey-600",
  3: "bg-grey-800 text-grey-0",
};

const sizeClass = {
  sm: "size-5 text-[9px]",
  md: "size-6 text-[10px]",
  lg: "size-8 text-caption",
} as const;

export function UserAvatar({
  userId,
  size = "sm",
  className,
}: {
  userId: string | null;
  size?: keyof typeof sizeClass;
  className?: string;
}) {
  const user = getUser(userId);

  if (!user) {
    return (
      <span
        title="Unassigned"
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-dashed border-grey-300 text-grey-400",
          sizeClass[size],
          className,
        )}
      >
        <span aria-hidden>·</span>
        <span className="sr-only">Unassigned</span>
      </span>
    );
  }

  return (
    <span
      title={user.name}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        toneClass[user.tone],
        sizeClass[size],
        className,
      )}
    >
      <span aria-hidden>{user.initials}</span>
      <span className="sr-only">{user.name}</span>
    </span>
  );
}
