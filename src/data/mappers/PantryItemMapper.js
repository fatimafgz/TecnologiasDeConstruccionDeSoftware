/** CAPA DE ACCESO A DATOS — Mapper de lotes de despensa (incluye JOIN con ingredients). */
import { PantryItem } from '../../domain/PantryItem.js';

export const PantryItemMapper = {
  toDomain(row) {
    if (!row) return null;
    return new PantryItem({
      id: row.id,
      ingredientId: row.ingredient_id,
      ingredientName: row.ingredient_name ?? null,
      category: row.category ?? null,
      quantity: row.quantity,
      unit: row.unit,
      expiryDate: row.expiry_date,
      addedAt: row.added_at,
    });
  },
  toPersistence(e) {
    return {
      ingredient_id: e.ingredientId, quantity: e.quantity,
      unit: e.unit, expiry_date: e.expiryDate,
    };
  },
};
