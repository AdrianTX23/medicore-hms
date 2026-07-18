import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { AdmissionsTable } from "@/features/admissions/components/admissions-table";
import { BedMap } from "@/features/admissions/components/bed-map";
import { getBedMap, listActiveAdmissions } from "@/features/admissions/queries/admission.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { parseTableParams } from "@/shared/utils/table-params";

export const metadata: Metadata = { title: "Hospitalización" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdmissionsPage({ searchParams }: PageProps) {
  const user = await requirePermissionPage("admissions:read");
  const params = parseTableParams(await searchParams);

  const [wards, admissions] = await Promise.all([
    getBedMap(),
    listActiveAdmissions({ skip: params.skip, take: params.take }),
  ]);

  return (
    <>
      <PageHeader title="Hospitalización" description="Mapa de camas e ingresos activos">
        {user.permissions.has("admissions:create") ? (
          <Button asChild>
            <Link href="/admissions/new">
              <Plus /> Nuevo ingreso
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <Tabs defaultValue="map">
        <TabsList>
          <TabsTrigger value="map">Mapa de camas</TabsTrigger>
          <TabsTrigger value="active">Ingresos activos ({admissions.total})</TabsTrigger>
        </TabsList>
        <TabsContent value="map" className="mt-4">
          <BedMap wards={wards} canAdmit={user.permissions.has("admissions:create")} />
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          <AdmissionsTable result={admissions} />
        </TabsContent>
      </Tabs>
    </>
  );
}
