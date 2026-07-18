"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Permission, RoleName } from "@/lib/auth/permissions";
import { MediCoreMark } from "@/shared/components/brand/medicore-mark";
import { NAV_GROUPS } from "@/shared/components/layout/nav-items";
import { NavUser } from "@/shared/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";

export type SidebarUser = {
  name: string;
  email: string;
  role: RoleName;
  avatarUrl: string | null;
  permissions: Permission[];
};

type AppSidebarProps = {
  user: SidebarUser;
  signOutAction: () => Promise<void>;
};

export function AppSidebar({ user, signOutAction }: AppSidebarProps) {
  const pathname = usePathname();
  const permissions = new Set(user.permissions);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || permissions.has(item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <MediCoreMark className="aspect-square" />
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">MediCore</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Hospital Management
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon weight={isActive ? "fill" : "regular"} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} signOutAction={signOutAction} />
      </SidebarFooter>
    </Sidebar>
  );
}
