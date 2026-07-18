import { Badge, type badgeVariants } from "@/shared/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/**
 * Renders a `Badge` from a status value plus its label/variant maps —
 * the `<Badge variant={X_VARIANTS[s]}>{X_LABELS[s]}</Badge>` pattern that
 * was duplicated across every feature's tables. Each feature keeps owning
 * its own `*_STATUS_LABELS`/`*_STATUS_VARIANTS` constants; only the render
 * is shared.
 */
export function StatusBadge<T extends string>({
  status,
  labels,
  variants,
  className,
}: {
  status: T;
  labels: Record<T, string>;
  variants: Record<T, BadgeVariant>;
  className?: string;
}) {
  return (
    <Badge variant={variants[status]} className={className}>
      {labels[status]}
    </Badge>
  );
}
