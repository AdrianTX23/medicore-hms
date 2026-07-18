import Link from "next/link";
import { BED_STATUS_COLORS, BED_STATUS_LABELS } from "@/features/admissions/constants";
import type { DepartmentWard } from "@/features/admissions/queries/admission.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function BedMap({ wards, canAdmit }: { wards: DepartmentWard[]; canAdmit: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {Object.entries(BED_STATUS_LABELS).map(([status, label]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: BED_STATUS_COLORS[status as keyof typeof BED_STATUS_COLORS] }}
            />
            {label}
          </span>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {wards.map((ward) => (
          <Card key={ward.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {ward.name}
                <span className="text-xs font-normal text-muted-foreground">
                  {ward.beds.filter((b) => b.status === "OCCUPIED").length}/{ward.beds.length} ocupadas
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ward.beds.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin camas registradas</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {ward.beds.map((bed) => {
                    const color = BED_STATUS_COLORS[bed.status];
                    const href = bed.admission
                      ? `/admissions/${bed.admission.id}`
                      : bed.status === "AVAILABLE" && canAdmit
                        ? `/admissions/new?bedId=${bed.id}`
                        : undefined;
                    const tile = (
                      <div
                        className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-center transition-transform hover:scale-105"
                        style={{
                          borderColor: color,
                          backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
                        }}
                        title={
                          bed.admission
                            ? `${bed.admission.patient.firstName} ${bed.admission.patient.lastName} (${bed.admission.patient.mrn})`
                            : BED_STATUS_LABELS[bed.status]
                        }
                      >
                        {/* Status is conveyed by border/legend color; the label itself stays
                            on the theme foreground so it meets contrast at 10px regardless
                            of which status color (e.g. amber) is in play. */}
                        <span className="text-[10px] font-semibold text-foreground">
                          {bed.code}
                        </span>
                        {bed.admission ? (
                          <span className="text-[10px] font-medium">
                            {initials(bed.admission.patient.firstName, bed.admission.patient.lastName)}
                          </span>
                        ) : null}
                      </div>
                    );
                    return href ? (
                      <Link key={bed.id} href={href}>
                        {tile}
                      </Link>
                    ) : (
                      <div key={bed.id}>{tile}</div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
