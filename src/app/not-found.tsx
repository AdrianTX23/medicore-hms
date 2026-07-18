import Link from "next/link";
import { House } from "@phosphor-icons/react/dist/ssr";
import { MediCoreMark } from "@/shared/components/brand/medicore-mark";
import { Button } from "@/shared/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <MediCoreMark className="h-9 w-auto" />
      <div className="space-y-2">
        <p className="text-6xl font-semibold tabular-nums text-primary">404</p>
        <p className="text-sm text-muted-foreground">Esta página no existe o fue movida.</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">
          <House /> Ir al panel
        </Link>
      </Button>
    </div>
  );
}
