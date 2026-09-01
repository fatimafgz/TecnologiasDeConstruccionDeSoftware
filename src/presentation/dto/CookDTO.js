/** CAPA DE PRESENTACION — DTO para el modo "¡Cocinada!". */
import { ValidationError } from '../../business/errors.js';

export class CookDTO {
  static from(body) {
    const recipeId = Number(body?.recipeId);
    const servings = Number(body?.servings);
    const errors = {};
    if (!Number.isInteger(recipeId) || recipeId <= 0) errors.recipeId = 'Id de receta requerido';
    if (!Number.isInteger(servings) || servings <= 0) errors.servings = 'Comensales debe ser entero positivo';
    if (Object.keys(errors).length) throw new ValidationError('Peticion de cocinado invalida', errors);
    return { recipeId, servings };
  }
}
