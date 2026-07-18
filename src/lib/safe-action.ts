import "server-only";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { DomainError } from "@/core/errors";
import { requireAuth } from "@/lib/auth/guards";
import type { Permission } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * Every Server Action returns this shape — components never see exceptions.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

type SafeActionConfig<TSchema extends z.ZodType, TOutput> = {
  /** Zod schema — server-side validation is the real barrier, client is UX. */
  schema: TSchema;
  /** Required permission. Omit only for actions any authenticated user may run. */
  permission?: Permission;
  /** When set, the action is recorded in the immutable audit log. */
  audit?: { action: string; entity: string };
  handler: (input: z.infer<TSchema>, ctx: { user: SessionUser }) => Promise<TOutput>;
};

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

async function writeAuditLog(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  newValues?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        newValues: params.newValues as object | undefined,
      },
    });
  } catch (e) {
    // The audit trail must never break the business flow — log and continue.
    console.error("[audit] failed to write audit log:", e);
  }
}

/**
 * Wraps a Server Action with the full pipeline:
 *   auth → permission → Zod validation → handler → audit log
 *
 * Usage:
 *   export const createPatient = createSafeAction({
 *     schema: createPatientSchema,
 *     permission: "patients:create",
 *     audit: { action: "patients:create", entity: "Patient" },
 *     handler: (input, { user }) => patientService.create(input, user),
 *   });
 */
export function createSafeAction<TSchema extends z.ZodType, TOutput>(
  config: SafeActionConfig<TSchema, TOutput>,
) {
  return async (rawInput: unknown): Promise<ActionResult<TOutput>> => {
    try {
      const user = await requireAuth();

      if (config.permission && !user.permissions.has(config.permission)) {
        return { success: false, error: "No tienes permisos para realizar esta acción" };
      }

      const parsed = config.schema.safeParse(rawInput);
      if (!parsed.success) {
        return {
          success: false,
          error: "Los datos enviados no son válidos",
          fieldErrors: toFieldErrors(parsed.error),
        };
      }

      const data = await config.handler(parsed.data, { user });

      if (config.audit) {
        const entityId =
          data && typeof data === "object" && "id" in data
            ? String((data as { id: unknown }).id)
            : undefined;
        await writeAuditLog({
          userId: user.id,
          action: config.audit.action,
          entity: config.audit.entity,
          entityId,
          newValues: parsed.data,
        });
      }

      return { success: true, data };
    } catch (error) {
      if (error instanceof DomainError) {
        return { success: false, error: error.message };
      }
      console.error("[action] unexpected error:", error);
      Sentry.captureException(error);
      return { success: false, error: "Ocurrió un error inesperado. Inténtalo de nuevo." };
    }
  };
}
