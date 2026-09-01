/**
 * CAPA DE PRESENTACION — DTO de entrada + validacion basica de forma.
 * Aqui solo se valida la FORMA del payload; las reglas de negocio
 * (fechas coherentes, unidades permitidas) viven en PantryService.
 */
import { ValidationError } from '../../business/errors.js';

export class CreatePantryItemDTO {
  static from(body) {
    if (!body || typeof body !== 'object') throw new ValidationError('Cuerpo JSON requerido');
    const dto = {
      name: typeof body.name === 'string' ? body.name.trim() : '',
      category: typeof body.category === 'string' ? body.category : undefined,
      quantity: Number(body.quantity),
      unit: typeof body.unit === 'string' ? body.unit : '',
      expiryDate: typeof body.expiryDate === 'string' ? body.expiryDate.slice(0, 10) : '',
    };
    if (Number.isNaN(dto.quantity)) throw new ValidationError('La cantidad debe ser numerica', { quantity: 'numero requerido' });
    return dto;
  }
}

export class UpdateQuantityDTO {
  static from(body) {
    const quantity = Number(body?.quantity);
    if (!Number.isFinite(quantity)) {
      throw new ValidationError('Cantidad invalida', { quantity: 'numero requerido' });
    }
    return { quantity };
  }
}
