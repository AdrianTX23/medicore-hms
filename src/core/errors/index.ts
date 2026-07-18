/**
 * Typed domain errors. Services throw these; the safe-action wrapper
 * translates them into serializable results — raw exceptions never
 * reach the client.
 */

export class DomainError extends Error {
  readonly code: string;

  constructor(message: string, code = "DOMAIN_ERROR") {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Debes iniciar sesión para realizar esta acción") {
    super(message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "No tienes permisos para realizar esta acción") {
    super(message, "FORBIDDEN");
  }
}

export class NotFoundError extends DomainError {
  constructor(resource = "El recurso") {
    super(`${resource} no existe o fue eliminado`, "NOT_FOUND");
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT");
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message, "BUSINESS_RULE");
  }
}
