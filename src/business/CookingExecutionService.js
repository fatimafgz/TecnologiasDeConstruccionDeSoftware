/**
 * CAPA DE LOGICA DE NEGOCIO — CookingExecutionService.
 * Modo "¡Cocinada!": descuenta del inventario las cantidades exactas usadas,
 * de forma transaccional (todo o nada) y siguiendo FEFO
 * (First Expired, First Out): primero se gasta el lote mas proximo a vencer.
 */
import { CookingLog } from '../domain/CookingLog.js';
import { NotFoundError, InsufficientStockError } from './errors.js';

export class CookingExecutionService {
  constructor({ recipeRepository, pantryRepository, cookingLogRepository,
                portionScalingService, transaction, clock = () => new Date() }) {
    this.recipes = recipeRepository;
    this.pantry = pantryRepository;
    this.logs = cookingLogRepository;
    this.scaling = portionScalingService;
    this.transaction = transaction;   // (fn) => resultado, inyectada desde /data
    this.clock = clock;
  }

  cook({ recipeId, servings }) {
    const recipe = this.recipes.findById(recipeId);
    if (!recipe) throw new NotFoundError(`Receta ${recipeId} no encontrada`);

    const now = this.clock();
    const lines = this.scaling.scaleIngredients(recipe, servings)
      .filter((l) => !l.optional);

    // 1) Planificacion: se resuelve el reparto por lotes ANTES de tocar la BD.
    const plan = [];
    const missing = [];
    let savedItems = 0;

    for (const line of lines) {
      const batches = this.pantry.findByIngredientIdOrderedByExpiry(line.ingredientId);
      let pending = line.quantity;
      const takes = [];

      for (const batch of batches) {
        if (pending <= 0.0001) break;
        const take = Math.min(batch.quantity, pending);
        pending = Number((pending - take).toFixed(3));
        takes.push({ batchId: batch.id, take, remaining: Number((batch.quantity - take).toFixed(3)) });
        if (batch.isAtRisk(now)) savedItems += 1;
      }

      if (pending > 0.0001) {
        missing.push({ name: line.name, needed: line.quantity, unit: line.unit,
                       shortBy: pending, available: line.quantity - pending });
      }
      plan.push({ line, takes });
    }

    if (missing.length) throw new InsufficientStockError(missing);

    // 2) Ejecucion transaccional: descuento + vaciado de lotes + bitacora.
    return this.transaction(() => {
      const consumed = [];
      for (const { line, takes } of plan) {
        for (const t of takes) {
          if (t.remaining <= 0.0001) this.pantry.remove(t.batchId);
          else this.pantry.updateQuantity(t.batchId, t.remaining);
        }
        consumed.push({ ingredientName: line.name, quantity: line.quantity, unit: line.unit });
      }

      const log = this.logs.add(new CookingLog({
        recipeId: recipe.id, servings: Number(servings), consumed, savedItems,
      }));

      return {
        log,
        message: savedItems > 0
          ? `¡Cocinada! Rescataste ${savedItems} ingrediente${savedItems > 1 ? 's' : ''} del desperdicio.`
          : '¡Cocinada! Despensa actualizada.',
      };
    });
  }

  history(limit = 10) { return this.logs.findRecent(limit); }
}
