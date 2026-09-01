/**
 * CAPA DE LOGICA DE NEGOCIO — PortionScalingService.
 * Recalcula cantidades de una receta segun el numero de comensales.
 *
 *   cantidad_escalada = cantidad_base x (comensales / porciones_base)
 */
import { ValidationError } from './errors.js';

export const ALLOWED_SERVINGS = [1, 2, 4, 6];

export class PortionScalingService {
  /** Factor de escala validado. */
  factor(recipe, servings) {
    const s = Number(servings);
    if (!Number.isFinite(s) || s <= 0 || s > 24) {
      throw new ValidationError('Numero de comensales invalido (1 a 24)');
    }
    return s / recipe.baseServings;
  }

  /** Lineas de la receta con cantidades escaladas y redondeadas por unidad. */
  scaleIngredients(recipe, servings) {
    const f = this.factor(recipe, servings);
    return recipe.ingredients.map((line) => ({
      ingredientId: line.ingredientId,
      name: line.ingredientName,
      unit: line.unit,
      weight: line.weight,
      optional: line.optional,
      baseQuantity: line.quantity,
      quantity: this.#round(line.quantity * f, line.unit),
    }));
  }

  /** 'pza' se redondea hacia arriba a enteros; g/ml a un decimal util. */
  #round(value, unit) {
    if (unit === 'pza') return Math.max(1, Math.ceil(value));
    return Math.round(value * 10) / 10;
  }
}
