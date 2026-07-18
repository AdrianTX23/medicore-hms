/**
 * MediCore HMS — database seed.
 * Idempotent (upsert-based): safe to run multiple times.
 *
 * Seeds: roles + permissions (from the canonical matrix), clinical catalogs,
 * departments/rooms/beds, and — when SUPABASE_SERVICE_ROLE_KEY is present —
 * one demo user per role (password: MediCore#2026).
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  type RoleName,
} from "../src/lib/auth/permissions";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function seedRbac() {
  console.log("→ Seeding roles & permissions...");

  const roleDescriptions: Record<RoleName, string> = {
    SUPER_ADMIN: "Configuración del sistema, usuarios y auditoría",
    ADMIN: "Operación de la clínica: personal, facturación y reportes",
    DOCTOR: "Consultas, historia clínica, recetas y órdenes de laboratorio",
    NURSE: "Signos vitales, admisiones y cuidado de pacientes",
    RECEPTIONIST: "Registro de pacientes y gestión de agenda",
    LAB_TECHNICIAN: "Procesamiento y validación de resultados de laboratorio",
    PHARMACIST: "Dispensación de recetas e inventario de farmacia",
    ACCOUNTANT: "Facturación, pagos y reportes financieros",
    PATIENT: "Portal del paciente: citas, resultados y facturas propias",
  };

  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: { module: code.split(":")[0] },
      create: { code, module: code.split(":")[0] },
    });
  }

  for (const name of ROLES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description: roleDescriptions[name] },
      create: { name, description: roleDescriptions[name] },
    });

    // Reset and re-link so the DB always mirrors the canonical matrix
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const perms = await prisma.permission.findMany({
      where: { code: { in: [...ROLE_PERMISSIONS[name]] } },
      select: { id: true },
    });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
    });
  }
}

async function seedCatalogs() {
  console.log("→ Seeding clinical catalogs...");

  const specialties = [
    "Medicina General",
    "Medicina Interna",
    "Cardiología",
    "Pediatría",
    "Ginecología",
    "Traumatología",
    "Dermatología",
  ];
  for (const name of specialties) {
    await prisma.specialty.upsert({ where: { name }, update: {}, create: { name } });
  }

  const departments = ["Consulta Externa", "Urgencias", "Hospitalización", "Pediatría", "UCI"];
  for (const name of departments) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }

  const hosp = await prisma.department.findUniqueOrThrow({ where: { name: "Hospitalización" } });
  for (const [number, floor] of [["301", 3], ["302", 3], ["401", 4]] as const) {
    const room = await prisma.room.upsert({
      where: { departmentId_number: { departmentId: hosp.id, number } },
      update: {},
      create: { departmentId: hosp.id, number, floor },
    });
    for (const suffix of ["A", "B"]) {
      const code = `${number}-${suffix}`;
      await prisma.bed.upsert({
        where: { roomId_code: { roomId: room.id, code } },
        update: {},
        create: { roomId: room.id, code },
      });
    }
  }

  const insurers = ["Sanitas", "Adeslas", "MAPFRE Salud", "AXA Salud"];
  for (const name of insurers) {
    await prisma.insuranceProvider.upsert({ where: { name }, update: {}, create: { name } });
  }

  const icd10: Array<[string, string]> = [
    ["J00", "Rinofaringitis aguda (resfriado común)"],
    ["J02.9", "Faringitis aguda, no especificada"],
    ["J45.9", "Asma, no especificada"],
    ["I10", "Hipertensión esencial (primaria)"],
    ["E11.9", "Diabetes mellitus tipo 2, sin complicaciones"],
    ["E66.9", "Obesidad, no especificada"],
    ["A09", "Diarrea y gastroenteritis de presunto origen infeccioso"],
    ["K29.7", "Gastritis, no especificada"],
    ["M54.5", "Lumbago no especificado"],
    ["N39.0", "Infección de vías urinarias, sitio no especificado"],
    ["R51", "Cefalea"],
    ["F41.1", "Trastorno de ansiedad generalizada"],
    ["Z00.0", "Examen médico general"],
    ["S52.5", "Fractura de la epífisis inferior del radio"],
    ["O80", "Parto único espontáneo"],
  ];
  for (const [code, description] of icd10) {
    await prisma.icd10Code.upsert({ where: { code }, update: { description }, create: { code, description } });
  }

  const labTests: Array<{
    code: string; name: string; category: string; sampleType: string; unit?: string; price: number;
  }> = [
    { code: "CBC", name: "Hemograma completo", category: "Hematología", sampleType: "sangre", price: 12 },
    { code: "GLU", name: "Glucosa en ayunas", category: "Química", sampleType: "sangre", unit: "mg/dL", price: 6 },
    { code: "HBA1C", name: "Hemoglobina glicosilada", category: "Química", sampleType: "sangre", unit: "%", price: 18 },
    { code: "CREA", name: "Creatinina sérica", category: "Química", sampleType: "sangre", unit: "mg/dL", price: 7 },
    { code: "LIPID", name: "Perfil lipídico", category: "Química", sampleType: "sangre", price: 20 },
    { code: "TSH", name: "Hormona estimulante de tiroides", category: "Hormonas", sampleType: "sangre", unit: "µUI/mL", price: 15 },
    { code: "URIN", name: "Uroanálisis", category: "Uroanálisis", sampleType: "orina", price: 8 },
    { code: "CRP", name: "Proteína C reactiva", category: "Inmunología", sampleType: "sangre", unit: "mg/L", price: 10 },
  ];
  for (const t of labTests) {
    await prisma.labTest.upsert({
      where: { code: t.code },
      update: { name: t.name, price: t.price },
      create: { ...t },
    });
  }

  const medications: Array<{ name: string; genericName?: string; form: "TABLET" | "CAPSULE" | "SYRUP" | "INJECTION" | "INHALER"; strength: string }> = [
    { name: "Paracetamol", form: "TABLET", strength: "500 mg" },
    { name: "Ibuprofeno", form: "TABLET", strength: "400 mg" },
    { name: "Amoxicilina", form: "CAPSULE", strength: "500 mg" },
    { name: "Omeprazol", form: "CAPSULE", strength: "20 mg" },
    { name: "Losartán", form: "TABLET", strength: "50 mg" },
    { name: "Metformina", form: "TABLET", strength: "850 mg" },
    { name: "Salbutamol", form: "INHALER", strength: "100 µg/dosis" },
    { name: "Loratadina", form: "TABLET", strength: "10 mg" },
  ];
  for (const m of medications) {
    await prisma.medication.upsert({
      where: { name_form_strength: { name: m.name, form: m.form, strength: m.strength } },
      update: {},
      create: m,
    });
  }

  const services: Array<{ code: string; name: string; type: "CONSULTATION" | "PROCEDURE" | "BED_DAY"; price: number }> = [
    { code: "CONS-GEN", name: "Consulta medicina general", type: "CONSULTATION", price: 30 },
    { code: "CONS-ESP", name: "Consulta con especialista", type: "CONSULTATION", price: 50 },
    { code: "CONS-URG", name: "Atención de urgencias", type: "CONSULTATION", price: 60 },
    { code: "PROC-ECG", name: "Electrocardiograma", type: "PROCEDURE", price: 35 },
    { code: "PROC-SUT", name: "Sutura menor", type: "PROCEDURE", price: 45 },
    { code: "BED-DAY", name: "Día de hospitalización", type: "BED_DAY", price: 120 },
  ];
  for (const s of services) {
    await prisma.service.upsert({
      where: { code: s.code },
      update: { name: s.name, price: s.price },
      create: s,
    });
  }
}

/**
 * Demo users (one per staff role, all sharing one publicly-documented
 * password) — requires the Supabase service role key AND an explicit
 * opt-in, so this can't run just because SUPABASE_SERVICE_ROLE_KEY happens
 * to be configured for something else (e.g. an admin script). Set
 * SEED_DEMO_USERS=true when you actually want the demo accounts (this
 * portfolio project's public deploy does — see README).
 */
async function seedDemoUsers() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log("⚠ SUPABASE_SERVICE_ROLE_KEY not set — skipping demo users.");
    return;
  }
  if (process.env.SEED_DEMO_USERS !== "true") {
    console.log("⚠ SEED_DEMO_USERS not set to \"true\" — skipping demo users (known shared password).");
    return;
  }

  console.log("→ Seeding demo users...");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const PASSWORD = "MediCore#2026";

  const demoUsers: Array<{
    email: string; role: RoleName; firstName: string; lastName: string; specialty?: string;
  }> = [
    { email: "superadmin@medicore.dev", role: "SUPER_ADMIN", firstName: "Sofía", lastName: "Ramírez" },
    { email: "admin@medicore.dev", role: "ADMIN", firstName: "Carlos", lastName: "Mendoza" },
    { email: "doctor@medicore.dev", role: "DOCTOR", firstName: "Elena", lastName: "Vargas", specialty: "Medicina General" },
    { email: "cardio@medicore.dev", role: "DOCTOR", firstName: "Andrés", lastName: "Herrera", specialty: "Cardiología" },
    { email: "nurse@medicore.dev", role: "NURSE", firstName: "Lucía", lastName: "Torres" },
    { email: "reception@medicore.dev", role: "RECEPTIONIST", firstName: "Marta", lastName: "Jiménez" },
    { email: "lab@medicore.dev", role: "LAB_TECHNICIAN", firstName: "Pablo", lastName: "Ortiz" },
    { email: "pharmacist@medicore.dev", role: "PHARMACIST", firstName: "Nuria", lastName: "Campos" },
    { email: "accountant@medicore.dev", role: "ACCOUNTANT", firstName: "Diego", lastName: "Salas" },
  ];

  for (const u of demoUsers) {
    // Create the auth user (or recover its id if it already exists)
    let authId: string | undefined;
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) {
      const { data: list } = await supabase.auth.admin.listUsers();
      authId = list?.users.find((x) => x.email === u.email)?.id;
      if (!authId) {
        console.error(`  ✗ ${u.email}: ${error.message}`);
        continue;
      }
    } else {
      authId = data.user.id;
    }

    const role = await prisma.role.findUniqueOrThrow({ where: { name: u.role } });
    const specialty = u.specialty
      ? await prisma.specialty.findUnique({ where: { name: u.specialty } })
      : null;

    await prisma.user.upsert({
      where: { id: authId },
      update: { email: u.email, roleId: role.id },
      create: { id: authId, email: u.email, roleId: role.id },
    });

    const profile = await prisma.staffProfile.upsert({
      where: { userId: authId },
      update: { firstName: u.firstName, lastName: u.lastName, specialtyId: specialty?.id },
      create: {
        userId: authId,
        firstName: u.firstName,
        lastName: u.lastName,
        specialtyId: specialty?.id,
      },
    });

    // Weekday availability for doctors: Mon–Fri, 09:00–13:00 and 15:00–18:00
    if (u.role === "DOCTOR") {
      for (let weekday = 1; weekday <= 5; weekday++) {
        for (const [startMinute, endMinute] of [[540, 780], [900, 1080]]) {
          await prisma.doctorSchedule.upsert({
            where: {
              doctorId_weekday_startMinute: { doctorId: profile.id, weekday, startMinute },
            },
            update: { endMinute },
            create: { doctorId: profile.id, weekday, startMinute, endMinute, slotMinutes: 30 },
          });
        }
      }
    }
    console.log(`  ✓ ${u.email} (${u.role})`);
  }
  console.log(`  Demo password for all users: ${PASSWORD}`);
}

async function seedDemoPatients() {
  console.log("→ Seeding demo patients...");
  const demo: Array<{
    documentId: string; firstName: string; lastName: string; birthDate: string;
    gender: "MALE" | "FEMALE"; bloodType: "O_POS" | "A_POS" | "B_NEG"; phone: string;
  }> = [
    { documentId: "48291733X", firstName: "Juan", lastName: "Pérez García", birthDate: "1985-03-12", gender: "MALE", bloodType: "O_POS", phone: "+34 612 334 455" },
    { documentId: "51230984T", firstName: "María", lastName: "López Ruiz", birthDate: "1992-11-03", gender: "FEMALE", bloodType: "A_POS", phone: "+34 655 908 122" },
    { documentId: "39481275M", firstName: "Rosa", lastName: "Fernández Gil", birthDate: "1958-07-24", gender: "FEMALE", bloodType: "B_NEG", phone: "+34 699 120 774" },
  ];

  for (const p of demo) {
    const existing = await prisma.patient.findUnique({ where: { documentId: p.documentId } });
    if (existing) continue;
    const created = await prisma.patient.create({
      data: {
        mrn: "PENDING",
        ...p,
        birthDate: new Date(p.birthDate),
      },
    });
    await prisma.patient.update({
      where: { id: created.id },
      data: { mrn: `MRN-${String(created.mrnSeq).padStart(6, "0")}` },
    });
  }
}

async function main() {
  await seedRbac();
  await seedCatalogs();
  await seedDemoUsers();
  await seedDemoPatients();
  console.log("✓ Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
