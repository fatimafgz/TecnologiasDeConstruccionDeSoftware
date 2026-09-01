/** CAPA DE ACCESO A DATOS — Mapper del historial de cocinado. */
import { CookingLog } from '../../domain/CookingLog.js';

export const CookingLogMapper = {
  toDomain(row) {
    if (!row) return null;
    return new CookingLog({
      id: row.id,
      recipeId: row.recipe_id,
      recipeTitle: row.recipe_title ?? null,
      servings: row.servings,
      cookedAt: row.cooked_at,
      consumed: JSON.parse(row.consumed || '[]'),
      savedItems: row.saved_items,
    });
  },
};
