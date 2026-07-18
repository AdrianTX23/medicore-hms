# Seguridad — MediCore HMS

Este documento explica el modelo de amenazas del proyecto, las capas de defensa implementadas, y una decisión de arquitectura que se dejó deliberadamente sin resolver: por qué **no** hay Row Level Security (RLS) en Postgres, a pesar de que el sistema maneja datos clínicos.

## Modelo de amenazas

MediCore HMS es un proyecto de portafolio que simula un HMS real, con datos ficticios. El modelo de amenazas que sí se toma en serio:

- **Un usuario autenticado accediendo a datos de otro usuario/paciente** (IDOR) — la clase de bug más grave encontrada y corregida en la auditoría del 18/07/2026.
- **Condiciones de carrera en operaciones concurrentes** con impacto clínico o financiero (doble asignación de cama, sobre-pago, doble dispensación).
- **Fuerza bruta contra el login.**
- **Inyección SQL** en las pocas rutas con SQL crudo (búsqueda de pacientes, índices parciales).

Lo que **no** está en alcance para este proyecto (documentado, no ignorado):

- Ataques que requieran comprometer la infraestructura de Supabase/Vercel en sí.
- Un atacante con acceso directo a la base de datos con las credenciales de servicio (ver sección RLS más abajo — es una aceptación consciente, no un descuido).
- Cumplimiento regulatorio real (HIPAA, GDPR) — el proyecto sigue *patrones* de software clínico serio (auditoría inmutable, historia clínica append-only) pero no es un sistema certificado ni maneja datos reales.

## Capas de defensa implementadas

La autorización se verifica en **tres capas independientes**, cada una re-derivando la sesión desde cero (nunca confiando en un valor que el cliente pudo haber manipulado):

1. **Middleware** ([`src/middleware.ts`](src/middleware.ts)) — refresca la sesión de Supabase y bloquea rutas sin autenticar antes de que la petición llegue a cualquier página.
2. **Server Actions** ([`src/lib/safe-action.ts`](src/lib/safe-action.ts)) — el pipeline `createSafeAction` verifica sesión → permiso → valida con Zod → ejecuta → audita, en ese orden, para toda mutación.
3. **Capa de datos — ownership scoping** ([`src/core/access-scope.ts`](src/core/access-scope.ts)) — desde la auditoría del 18/07/2026, toda query que el rol PATIENT pueda alcanzar (encuentros, facturas, laboratorio, citas) filtra explícitamente por `patientId`, tanto en listados como en el detalle. Antes de esto, el rol PATIENT podía leer el registro de *cualquier* paciente por ID — fue el hallazgo crítico de esa auditoría.

Además:

- **Concurrencia**: constraints e índices únicos parciales a nivel de Postgres (no solo checks en la aplicación) para las operaciones donde una condición de carrera tendría consecuencias reales — doble-booking de citas, doble asignación de cama, doble ingreso activo, sobre-pago de facturas, doble dispensación. Ver [`prisma/migrations/`](prisma/migrations/) y los tests de integración en `src/features/*/services/*.integration.test.ts`.
- **Rate limiting de login** — tabla `LoginAttempt`, bloqueo tras 5 intentos fallidos en 15 minutos, a nivel de base de datos (no en memoria — no serviría en un entorno serverless con múltiples instancias).
- **SQL crudo parametrizado** — el único SQL crudo real (búsqueda difusa de pacientes con `pg_trgm`/`unaccent`) usa `Prisma.sql`/`Prisma.join`, nunca concatenación de strings.
- **Auditoría inmutable** — toda mutación sensible queda registrada (usuario, acción, valores antes/después) vía el pipeline de `safe-action`, sin ruta de edición o borrado.
- **Secretos** — `SUPABASE_SERVICE_ROLE_KEY` solo se importa en un módulo marcado `server-only` que nunca se referencia desde un componente cliente; verificado explícitamente en la auditoría (grep de todo el árbol `src/`).

## Por qué no hay Row Level Security (decisión, no descuido)

Postgres soporta RLS: políticas a nivel de fila que se aplican automáticamente sin importar qué cliente ejecute la query. En teoría, sería una capa de defensa adicional — si alguna vez hay un bug de autorización en la aplicación, RLS seguiría bloqueando el acceso indebido a nivel de base de datos.

**En este proyecto, activar RLS hoy no serviría de nada**, y es importante ser honesto sobre por qué: la cadena de conexión de Prisma (`DATABASE_URL`) se conecta como el rol `postgres` de Supabase —

```
postgresql://postgres.<project-ref>:***@aws-1-us-west-2.pooler.supabase.com:6543/postgres
```

— que es superusuario (o tiene `BYPASSRLS`). Las políticas RLS **no se evalúan nunca** para ese rol, sin importar cuántas `CREATE POLICY` se agreguen a las tablas. Activar RLS sin cambiar esto sería seguridad de fachada: pasaría cualquier auditoría visual ("¿tienen RLS? sí") sin proteger absolutamente nada en la práctica.

Para que RLS aportara protección real haría falta un cambio de arquitectura más profundo, no una migración de una tarde:

1. Crear un rol de Postgres sin `BYPASSRLS`, con permisos mínimos, y mover `DATABASE_URL` a ese rol.
2. Inyectar el `user_id`/`role` de la sesión como una variable de sesión de Postgres (`SET LOCAL app.user_id = '...'`) al inicio de cada transacción de Prisma, para que las políticas RLS tengan con qué evaluar `USING (...)`.
3. Escribir y probar una política por tabla sensible (`patients`, `encounters`, `invoices`, `lab_results`, `prescriptions`), coherente con la matriz de permisos que ya existe en [`src/lib/auth/permissions.ts`](src/lib/auth/permissions.ts) — dos fuentes de verdad para la misma regla de negocio, que hay que mantener sincronizadas.
4. Verificar que ninguna query de Prisma (que no sabe nada de RLS) se rompa por una política mal escrita.

Es un proyecto real y bien definido — no está descartado, está fuera de alcance para un portafolio con esta relación costo/beneficio, y **la razón queda documentada aquí** en vez de dejarse implícita.

## Riesgo residual aceptado

Dado lo anterior, la autorización de este sistema depende **enteramente de la capa de aplicación** (las tres capas de la sección anterior). Esto es razonable para un proyecto de portafolio con datos ficticios; **no sería aceptable para un sistema en producción con PHI real** sin al menos una de estas dos cosas:

- Implementar RLS de verdad (con el cambio de rol descrito arriba), o
- Observabilidad que detecte una fuga de autorización rápidamente (ver el punto de Sentry/logging pendiente en el roadmap del [README](README.md)).

## Reportar una vulnerabilidad

Este es un proyecto de portafolio sin datos reales de usuarios. Si encuentras un problema de seguridad revisando el código, abre un [issue en GitHub](https://github.com/AdrianTX23/medicore-hms/issues) — no hace falta coordinación privada de disclosure para un proyecto sin usuarios en producción.
