import { redirect } from "next/navigation";
import {
  CalendarCheck,
  Flask,
  Pill,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { getCurrentUser } from "@/lib/auth/session";
import { MediCoreMark } from "@/shared/components/brand/medicore-mark";
import { HospitalScene } from "@/shared/components/illustrations/hospital-scene";
import { LiveClock } from "@/shared/components/illustrations/live-clock";
import { FadeIn } from "@/shared/components/motion/fade-in";

const FEATURES = [
  { icon: UsersThree, label: "Pacientes" },
  { icon: CalendarCheck, label: "Agenda" },
  { icon: Flask, label: "Laboratorio" },
  { icon: Pill, label: "Farmacia" },
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center gap-8 p-8">
        <div className="flex items-center gap-2 lg:hidden">
          <MediCoreMark />
          <span className="text-lg font-semibold">MediCore HMS</span>
        </div>
        <FadeIn className="w-full max-w-sm">{children}</FadeIn>
      </div>

      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <FadeIn delay={0} y={-8} className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/15 p-1">
              <MediCoreMark className="size-full" />
            </span>
            MediCore HMS
          </div>
          <LiveClock />
        </FadeIn>

        <HospitalScene />

        <FadeIn delay={0.35} className="relative z-10 space-y-4">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed">
              &ldquo;Gestión clínica integral: pacientes, agenda, historia clínica,
              laboratorio y facturación en una sola plataforma.&rdquo;
            </p>
            <footer className="text-sm opacity-80">Diseñado para clínicas que escalan</footer>
          </blockquote>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm opacity-90">
            {FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-center gap-1.5">
                <feature.icon className="size-4" />
                {feature.label}
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </div>
  );
}
