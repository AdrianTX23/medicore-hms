import { signOut } from "@/features/auth";
import { requireAuthPage } from "@/lib/auth/guards";
import { AppSidebar, type SidebarUser } from "@/shared/components/layout/app-sidebar";
import { Separator } from "@/shared/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthPage();

  const sidebarUser: SidebarUser = {
    name: user.staffProfile
      ? `${user.staffProfile.firstName} ${user.staffProfile.lastName}`
      : user.email,
    email: user.email,
    role: user.role,
    avatarUrl: user.staffProfile?.avatarUrl ?? null,
    permissions: [...user.permissions],
  };

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} signOutAction={signOut} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <main className="flex-1 space-y-6 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
