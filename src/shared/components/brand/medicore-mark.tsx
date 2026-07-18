import { cn } from "@/shared/utils/cn";

/** The MediCore logo mark: a rounded square with a medical cross. */
export function MediCoreMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      role="img"
      aria-label="MediCore"
    >
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <path
        d="M16 8v16M8 16h16"
        stroke="var(--primary-foreground)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
