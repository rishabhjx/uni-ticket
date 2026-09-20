import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CornerUpLeft,
  CornerUpRight,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * ReUI's components reference icons through a placeholder so the registry can
 * emit whichever icon set you picked. This project uses lucide, so the shim
 * resolves the lucide name and drops the other sets.
 */
const icons: Record<string, LucideIcon> = {
  ChevronDownIcon: ChevronDown,
  ChevronLeftIcon: ChevronLeft,
  ChevronRightIcon: ChevronRight,
  CornerUpLeftIcon: CornerUpLeft,
  CornerUpRightIcon: CornerUpRight,
  XIcon: X,
};

export function IconPlaceholder({
  lucide,
  className,
  ...props
}: {
  lucide: string;
  /** Accepted and ignored — other icon sets are not installed. */
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  const Icon = icons[lucide] ?? ChevronRight;
  return <Icon className={className} {...props} />;
}
