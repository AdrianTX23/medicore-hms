import type { Icon } from "@phosphor-icons/react";

type EmptyStateProps = {
  icon?: Icon;
  title: string;
  description?: string;
  /** Call-to-action, e.g. a "Nuevo paciente" button. */
  children?: React.ReactNode;
};

export function EmptyState({ icon: IconComponent, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      {IconComponent ? (
        <IconComponent className="size-10 text-muted-foreground" weight="thin" />
      ) : null}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
