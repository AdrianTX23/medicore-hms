import Link from "next/link";
import { House, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/shared/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-24 text-center">
      <MagnifyingGlass className="size-10 text-muted-foreground" weight="thin" />
      <div className="space-y-1">
        <p className="font-medium">No encontramos lo que buscas</p>
        <p className="text-sm text-muted-foreground">
          El registro no existe, fue eliminado, o no tienes acceso a él.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">
          <House /> Ir al panel
        </Link>
      </Button>
    </div>
  );
}
