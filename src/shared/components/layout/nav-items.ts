import type { Icon } from "@phosphor-icons/react";
import {
  Bed,
  Calendar,
  ChartBar,
  Flask,
  Gear,
  House,
  Pill,
  Receipt,
  ShieldCheck,
  Stethoscope,
  Users,
  UsersThree,
} from "@phosphor-icons/react";
import type { Permission } from "@/lib/auth/permissions";

export type NavItem = {
  title: string;
  href: string;
  icon: Icon;
  /** Hidden from the sidebar when the user lacks this permission. */
  permission?: Permission;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Clínica",
    items: [
      { title: "Inicio", href: "/dashboard", icon: House },
      { title: "Pacientes", href: "/patients", icon: Users, permission: "patients:read" },
      { title: "Citas", href: "/appointments", icon: Calendar, permission: "appointments:read" },
      { title: "Consultas", href: "/encounters", icon: Stethoscope, permission: "encounters:read" },
    ],
  },
  {
    label: "Servicios",
    items: [
      { title: "Laboratorio", href: "/laboratory", icon: Flask, permission: "laboratory:read" },
      { title: "Farmacia", href: "/pharmacy", icon: Pill, permission: "pharmacy:read" },
      { title: "Hospitalización", href: "/admissions", icon: Bed, permission: "admissions:read" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { title: "Facturación", href: "/billing", icon: Receipt, permission: "billing:read" },
      { title: "Personal", href: "/staff", icon: UsersThree, permission: "staff:read" },
      { title: "Reportes", href: "/reports", icon: ChartBar, permission: "reports:read" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Auditoría", href: "/audit", icon: ShieldCheck, permission: "audit:read" },
      { title: "Configuración", href: "/settings", icon: Gear, permission: "settings:read" },
    ],
  },
];
