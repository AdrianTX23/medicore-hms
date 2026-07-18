import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { PatientsTable } from "@/features/patients/components/patients-table";
import { searchPatients } from "@/features/patients/queries/patient.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { DataTableSearch } from "@/shared/components/data-table";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { parseTableParams } from "@/shared/utils/table-params";

export const metadata: Metadata = { title: "Pacientes" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientsPage({ searchParams }: PageProps) {
  const user = await requirePermissionPage("patients:read");
  const params = parseTableParams(await searchParams);

  const result = await searchPatients({
    q: params.q,
    skip: params.skip,
    take: params.take,
  });

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Registro y búsqueda de pacientes de la clínica"
      >
        {user.permissions.has("patients:create") ? (
          <Button asChild>
            <Link href="/patients/new">
              <Plus /> Nuevo paciente
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <DataTableSearch placeholder="Buscar por nombre, documento o MRN..." />

      <PatientsTable
        result={result}
        canUpdate={user.permissions.has("patients:update")}
        canDelete={user.permissions.has("patients:delete")}
      />
    </>
  );
}
