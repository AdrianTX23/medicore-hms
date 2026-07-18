# MediCore HMS

Sistema integral de gestión hospitalaria (Hospital Management System) construido con una arquitectura limpia, feature-based y pensada para escalar: pacientes, agenda médica, historia clínica electrónica, laboratorio, farmacia, hospitalización y facturación.

> Proyecto de portafolio con estándares de software clínico real: RBAC con 9 roles, auditoría inmutable, historia clínica append-only y prevención de doble-booking a nivel de base de datos.

🌐 **[Demo en vivo](https://medicore-hms-sage.vercel.app)** — inicia sesión con cualquiera de las [credenciales de demostración](#usuarios-demo-contraseña-medicore2026).
📖 **[Manual de usuario](docs/manual-usuario.pdf)** — recorrido por cada módulo con capturas de pantalla, tabla de roles y permisos, y credenciales de demostración.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions) + React 19 |
| Lenguaje | TypeScript (strict) |
| UI | TailwindCSS 4 + shadcn/ui + Framer Motion + Recharts |
| Datos | Supabase (PostgreSQL + Auth + Storage) + Prisma 7 |
| Estado / formularios | TanStack Query + React Hook Form + Zod |

## Arquitectura

```
src/
├── app/          # App Router: solo routing, layouts y páginas delgadas
├── core/         # Dominio puro: errores tipados, constantes (sin framework)
├── features/     # Un módulo por carpeta: actions / services / queries /
│                 # components / hooks / schemas — API pública vía index.ts
├── shared/       # UI reutilizable (shadcn, DataTable, layout) sin lógica de negocio
└── lib/          # Infraestructura: prisma, supabase, auth/RBAC, safe-action
```

**Regla de dependencia:** `app → features → core`; `shared` y `lib` no importan de `features`.

Cada mutación sigue el mismo pipeline:

```
Componente (RHF + Zod) → Server Action (safe-action: auth → permiso → Zod)
→ Service (caso de uso) → Prisma → audit log + revalidación
```

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia `.env.example` a `.env` y rellena:
   - `DATABASE_URL` — pooler de transacciones (puerto **6543**)
   - `DIRECT_URL` — conexión directa (puerto **5432**, usada por las migraciones)
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — necesaria para que el seed cree los usuarios demo
   - `SEED_DEMO_USERS="true"` — opt-in explícito: el seed no crea cuentas con contraseña compartida solo porque exista la service role key

### 2. Instalar, migrar y sembrar

```bash
npm install
npm run db:migrate   # aplica prisma/migrations (incluye índices anti doble-booking y búsqueda trigram)
npm run db:seed      # roles, permisos, catálogos clínicos y usuarios demo
```

### 3. Levantar el entorno

```bash
npm run dev
```

### Usuarios demo (contraseña: `MediCore#2026`)

| Email | Rol |
|---|---|
| superadmin@medicore.dev | Superadministrador |
| admin@medicore.dev | Administración |
| doctor@medicore.dev | Médico (Medicina General) |
| cardio@medicore.dev | Médico (Cardiología) |
| nurse@medicore.dev | Enfermería |
| reception@medicore.dev | Recepción |
| lab@medicore.dev | Laboratorio |
| pharmacist@medicore.dev | Farmacia |
| accountant@medicore.dev | Contabilidad |

## Seguridad (defensa en profundidad)

1. **Middleware** — refresca la sesión de Supabase y bloquea rutas sin autenticar.
2. **Server Actions** — `createSafeAction` valida sesión, permiso (`modulo:accion`), entrada Zod y registra auditoría.
3. **Base de datos** — restricciones e índices que hacen imposibles los estados inválidos (doble-booking, duplicados).

La matriz canónica de roles y permisos vive en [`src/lib/auth/permissions.ts`](src/lib/auth/permissions.ts) y se persiste en la base de datos vía seed.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | Verificación de tipos |
| `npm run db:migrate` | Aplica migraciones (`prisma migrate deploy`) |
| `npm run db:seed` | Ejecuta `prisma/seed.ts` (idempotente) |
| `npm run db:studio` | Prisma Studio |

## Roadmap por fases

- [x] **Fase 1 — Fundación:** auth + RBAC, schema completo (30+ tablas), layout, DataTable genérica
- [x] **Fase 2 — Pacientes:** CRUD con soft delete, búsqueda difusa sin acentos (pg_trgm + unaccent), perfil 360° con contactos y seguros
- [x] **Fase 3 — Agenda:** slots calculados de horarios − excepciones − citas, máquina de estados (check-in → en curso → completada), cancelación con motivo, doble-booking imposible a nivel DB
- [x] **Fase 4 — EMR:** consulta iniciada desde la cita (check-in → en curso → completada), signos vitales, diagnósticos CIE-10 con búsqueda, recetas multilinea, cierre inmutable (exige diagnóstico) y addendums firmados
- [x] **Fase 5 — Laboratorio y farmacia:** cola de laboratorio con máquina de estados y validación por segundo rol, detección automática de anormalidad, dispensación FEFO con ledger de stock inmutable, alertas de stock bajo y vencimiento
- [x] **Fase 6 — Facturación:** borrador automático desde consulta cerrada (con cobertura de seguro aplicada), factura manual, emisión, pagos parciales con transición de estado automática, anulación protegida
- [x] **Fase 7 — Hospitalización y reportes:** mapa de camas por departamento, ingreso/traslado/alta con transiciones de estado reales, y reportes con Recharts (ingresos mensuales, citas por estado, diagnósticos más frecuentes)
- [x] **Fase 8 — Auditoría de production readiness:** ver sección siguiente

## Auditoría de production readiness

Antes de dar el proyecto por terminado se hizo una auditoría multi-disciplinar completa (arquitectura, seguridad, base de datos, frontend, accesibilidad, escalabilidad y DevOps) y se corrigieron los hallazgos reales, entre ellos:

- **Seguridad** — corregido un IDOR: el rol PACIENTE ahora solo puede ver sus propios encuentros, facturas, órdenes de laboratorio y citas (antes veía cualquier registro por ID). Rate limiting en el login (bloqueo tras 5 intentos fallidos en 15 min, respaldado en base de datos).
- **Concurrencia** — condiciones de carrera corregidas con constraints e índices únicos parciales a nivel de base de datos (mismo patrón que el anti-doble-booking de citas): una cama no puede asignarse dos veces, un paciente no puede tener dos ingresos activos, una factura no puede sobre-pagarse, una receta no puede dispensarse dos veces.
- **Base de datos** — 19 índices nuevos en foreign keys usadas en queries reales, constraint de unicidad para diagnósticos duplicados.
- **Resiliencia de UI** — `error.tsx`, `not-found.tsx` y `loading.tsx` en toda la app (antes cualquier excepción mostraba la pantalla genérica de Next.js).
- **UX/accesibilidad** — modo oscuro activado (estaba completamente diseñado pero sin `ThemeProvider`), filas de tabla operables por teclado, contraste corregido en el mapa de camas, animaciones respetan `prefers-reduced-motion`.
- **Calidad de código** — componente `StatusBadge` compartido (eliminó duplicación en 5 features), dos formularios migrados a React Hook Form + Zod para consistencia con el resto de la app, dashboard con queries paralelas en vez de secuenciales.
- **Operación** — endpoint `/api/health`, CI en GitHub Actions (lint + typecheck en cada PR), seed de usuarios demo detrás de un opt-in explícito (`SEED_DEMO_USERS`).
