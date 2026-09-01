/**
 * CAPA DE ACCESO A DATOS — Contratos (puertos).
 * La capa de negocio depende SOLO de estas interfaces, nunca de SQLite.
 * En JS se expresan como clases abstractas que fallan si no se implementan.
 */
const abstract = (cls, method) => {
  throw new Error(`${cls}.${method}() no implementado`);
};

export class IIngredientRepository {
  findAll() { abstract('IIngredientRepository', 'findAll'); }
  findById(id) { abstract('IIngredientRepository', 'findById'); }
  findByName(name) { abstract('IIngredientRepository', 'findByName'); }
  create(ingredient) { abstract('IIngredientRepository', 'create'); }
  findOrCreateByName(name, category, unit) { abstract('IIngredientRepository', 'findOrCreateByName'); }
}

export class IPantryRepository {
  findAll() { abstract('IPantryRepository', 'findAll'); }
  findById(id) { abstract('IPantryRepository', 'findById'); }
  findByIngredientIdOrderedByExpiry(ingredientId) { abstract('IPantryRepository', 'findByIngredientIdOrderedByExpiry'); }
  add(item) { abstract('IPantryRepository', 'add'); }
  updateQuantity(id, quantity) { abstract('IPantryRepository', 'updateQuantity'); }
  remove(id) { abstract('IPantryRepository', 'remove'); }
}

export class IRecipeRepository {
  findAll() { abstract('IRecipeRepository', 'findAll'); }
  findById(id) { abstract('IRecipeRepository', 'findById'); }
}

export class ICookingLogRepository {
  add(log) { abstract('ICookingLogRepository', 'add'); }
  findRecent(limit) { abstract('ICookingLogRepository', 'findRecent'); }
}
