/** CAPA DE ACCESO A DATOS — Mapper fila SQL <-> Entidad de dominio. */
import { Ingredient } from '../../domain/Ingredient.js';

export const IngredientMapper = {
  toDomain(row) {
    if (!row) return null;
    return new Ingredient({
      id: row.id, name: row.name,
      category: row.category, defaultUnit: row.default_unit,
    });
  },
  toPersistence(e) {
    return { name: e.name, category: e.category, default_unit: e.defaultUnit };
  },
};
