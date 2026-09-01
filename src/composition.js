/**
 * COMPOSITION ROOT — unico lugar donde las capas se conocen entre si.
 * Construye la pila de dependencias respetando el flujo unidireccional:
 *   Presentacion -> Negocio -> Acceso a Datos -> Persistencia
 */
import { createConnection, withTransaction } from './data/db/connection.js';
import { SqliteIngredientRepository } from './data/repositories/SqliteIngredientRepository.js';
import { SqlitePantryRepository } from './data/repositories/SqlitePantryRepository.js';
import { SqliteRecipeRepository } from './data/repositories/SqliteRecipeRepository.js';
import { SqliteCookingLogRepository } from './data/repositories/SqliteCookingLogRepository.js';

import { PantryService } from './business/PantryService.js';
import { PortionScalingService } from './business/PortionScalingService.js';
import { RecipeMatchingService } from './business/RecipeMatchingService.js';
import { CookingExecutionService } from './business/CookingExecutionService.js';

export function buildContainer({ dbFile, clock = () => new Date() } = {}) {
  // --- Capa de persistencia ---
  const db = dbFile ? createConnection(dbFile) : createConnection();

  // --- Capa de acceso a datos ---
  const ingredientRepository = new SqliteIngredientRepository(db);
  const pantryRepository = new SqlitePantryRepository(db);
  const recipeRepository = new SqliteRecipeRepository(db);
  const cookingLogRepository = new SqliteCookingLogRepository(db);

  // --- Capa de logica de negocio ---
  const portionScalingService = new PortionScalingService();
  const pantryService = new PantryService({ pantryRepository, ingredientRepository, clock });
  const recipeMatchingService = new RecipeMatchingService({
    recipeRepository, pantryRepository, portionScalingService, clock,
  });
  const cookingExecutionService = new CookingExecutionService({
    recipeRepository, pantryRepository, cookingLogRepository, portionScalingService,
    transaction: (fn) => withTransaction(db, fn), clock,
  });

  return {
    db,
    repositories: { ingredientRepository, pantryRepository, recipeRepository, cookingLogRepository },
    services: { pantryService, recipeMatchingService, portionScalingService, cookingExecutionService },
  };
}
