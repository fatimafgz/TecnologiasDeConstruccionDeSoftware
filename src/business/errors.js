/** CAPA DE NEGOCIO — Errores de dominio, traducidos a HTTP en la capa de presentacion. */
export class DomainError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.details = details;
  }
}
export class ValidationError extends DomainError {
  constructor(message, details = null) { super(message, 422, details); }
}
export class NotFoundError extends DomainError {
  constructor(message) { super(message, 404); }
}
export class InsufficientStockError extends DomainError {
  constructor(missing) {
    super('No hay suficientes ingredientes en la despensa', 409, { missing });
  }
}
