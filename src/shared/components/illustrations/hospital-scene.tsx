"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heartbeat, Pill, Stethoscope, Syringe } from "@phosphor-icons/react";

/** Subtle tiled medical-cross pattern used as a background texture. */
function CrossPattern() {
  return (
    <svg className="absolute inset-0 size-full opacity-[0.07]" aria-hidden="true">
      <pattern id="cross-pattern" width="56" height="56" patternUnits="userSpaceOnUse">
        <path
          d="M14 8v12M8 14h12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </pattern>
      <rect width="100%" height="100%" fill="url(#cross-pattern)" />
    </svg>
  );
}

/** A simple hospital campus skyline, anchored to the bottom of the panel. */
function HospitalSkyline() {
  return (
    <motion.svg
      viewBox="0 0 480 110"
      className="absolute inset-x-0 bottom-0 h-28 w-full text-primary-foreground"
      preserveAspectRatio="none"
      aria-hidden="true"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
    >
      <rect x="10" y="40" width="80" height="70" rx="6" fill="currentColor" opacity="0.08" />
      <rect x="100" y="14" width="120" height="96" rx="8" fill="currentColor" opacity="0.12" />
      {/* main building windows */}
      {Array.from({ length: 3 }).map((_, col) =>
        Array.from({ length: 3 }).map((_, row) => (
          <rect
            key={`${col}-${row}`}
            x={118 + col * 32}
            y={30 + row * 20}
            width="16"
            height="12"
            rx="2"
            fill="currentColor"
            opacity="0.22"
          />
        )),
      )}
      <rect x="230" y="42" width="90" height="68" rx="6" fill="currentColor" opacity="0.08" />
      <rect x="330" y="20" width="70" height="90" rx="6" fill="currentColor" opacity="0.1" />
      <rect x="410" y="52" width="60" height="58" rx="6" fill="currentColor" opacity="0.08" />
    </motion.svg>
  );
}

/** Continuous heartbeat / EKG pulse line, "drawn" on mount and gently replayed. */
function PulseLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 48" className={className} preserveAspectRatio="none" aria-hidden="true">
      <motion.path
        d="M0 24 H130 L145 8 L160 40 L175 16 L188 24 H400"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ pathLength: { duration: 1.6, delay: 0.9, ease: "easeInOut" }, opacity: { duration: 0.3, delay: 0.9 } }}
      />
    </svg>
  );
}

/** Friendly, abstract "healthcare worker" bust — logo-style, not a literal photo. */
function ClinicianBadge() {
  return (
    <svg viewBox="0 0 240 240" className="size-full" role="img" aria-label="Personal médico">
      <circle cx="120" cy="120" r="118" fill="var(--primary-foreground)" opacity="0.1" />
      <circle cx="120" cy="120" r="90" fill="var(--primary-foreground)" opacity="0.08" />
      {/* coat / torso */}
      <path
        d="M60 210 C60 160 82 142 120 142 C158 142 180 160 180 210 Z"
        fill="var(--primary-foreground)"
      />
      {/* coat lapels */}
      <path d="M120 142 L104 178 L120 168 Z" fill="var(--primary)" opacity="0.15" />
      <path d="M120 142 L136 178 L120 168 Z" fill="var(--primary)" opacity="0.15" />
      {/* stethoscope */}
      <path
        d="M96 146 C96 168 108 176 120 176 C132 176 144 168 144 146"
        fill="none"
        stroke="#1baf7a"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="120" cy="181" r="8" fill="#1baf7a" />
      {/* head */}
      <circle cx="120" cy="98" r="46" fill="var(--primary-foreground)" />
      {/* scrub cap */}
      <path
        d="M74 92 C74 58 96 42 120 42 C144 42 166 58 166 92 C154 82 138 78 120 78 C102 78 86 82 74 92 Z"
        fill="#1baf7a"
      />
      <circle cx="164" cy="70" r="6" fill="#1baf7a" />
      {/* id badge */}
      <rect x="104" y="188" width="32" height="20" rx="4" fill="var(--primary)" opacity="0.18" />
      <circle cx="112" cy="198" r="3" fill="#eda100" />
    </svg>
  );
}

/** A small floating "chip" with an icon, orbiting the clinician illustration with a gentle bob loop. */
function FloatingChip({
  icon,
  className,
  delay = 0,
  floatDelay = 0,
  reduceMotion = false,
}: {
  icon: React.ReactNode;
  className?: string;
  delay?: number;
  floatDelay?: number;
  reduceMotion?: boolean;
}) {
  return (
    <motion.div
      className={`absolute flex size-11 items-center justify-center rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground shadow-lg backdrop-blur-sm ${className ?? ""}`}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.5, delay: reduceMotion ? 0 : delay, ease: "backOut" }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
        className="flex items-center justify-center"
      >
        {icon}
      </motion.div>
    </motion.div>
  );
}

/**
 * The full illustrated scene for the login panel: skyline backdrop, cross
 * texture, a clinician badge and orbiting service icons, with a pulse-line
 * divider anchoring the feature list beneath it. Entrance is staggered so
 * the panel feels alive rather than dumped on screen at once.
 */
export function HospitalScene() {
  // Vestibular-safe: the entrance animations (brief, one-shot) stay; the
  // continuous loops (breathing blobs, bobbing badge/chips) are dropped
  // entirely when the OS asks for reduced motion.
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
      <CrossPattern />
      <HospitalSkyline />

      {/* decorative color blobs, slowly breathing */}
      <motion.div
        className="pointer-events-none absolute -top-16 -left-10 size-56 rounded-full bg-[#1baf7a] opacity-20 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute top-24 -right-16 size-64 rounded-full bg-[#eda100] opacity-15 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <motion.div
        className="relative flex size-64 items-center justify-center"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.6, ease: "backOut" }}
      >
        <motion.div
          className="size-full"
          animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ClinicianBadge />
        </motion.div>
        <FloatingChip
          icon={<Stethoscope className="size-5" weight="fill" />}
          className="top-0 -left-4"
          delay={0.5}
          floatDelay={0}
          reduceMotion={reduceMotion ?? false}
        />
        <FloatingChip
          icon={<Pill className="size-5" weight="fill" />}
          className="top-6 -right-6"
          delay={0.65}
          floatDelay={0.6}
          reduceMotion={reduceMotion ?? false}
        />
        <FloatingChip
          icon={<Syringe className="size-5" weight="fill" />}
          className="bottom-4 -left-8"
          delay={0.8}
          floatDelay={1.2}
          reduceMotion={reduceMotion ?? false}
        />
        <FloatingChip
          icon={<Heartbeat className="size-5" weight="fill" />}
          className="right-0 bottom-0"
          delay={0.95}
          floatDelay={1.8}
          reduceMotion={reduceMotion ?? false}
        />
      </motion.div>

      <PulseLine className="mt-6 h-8 w-56 text-primary-foreground/40" />
    </div>
  );
}
