/** CAPA DE ACCESO A DATOS — Mapper de recetas y sus lineas. */
import { Recipe } from '../../domain/Recipe.js';
import { RecipeIngredient } from '../../domain/RecipeIngredient.js';

export const RecipeMapper = {
  toDomain(row, ingredientRows = []) {
    if (!row) return null;
    return new Recipe({
      id: row.id,
      title: row.title,
      description: row.description,
      minutes: row.minutes,
      baseServings: row.base_servings,
      steps: JSON.parse(row.steps || '[]'),
      ingredients: ingredientRows.map(RecipeMapper.lineToDomain),
    });
  },
  lineToDomain(row) {
    return new RecipeIngredient({
      recipeId: row.recipe_id,
      ingredientId: row.ingredient_id,
      ingredientName: row.ingredient_name ?? null,
      quantity: row.quantity,
      unit: row.unit,
      weight: row.weight,
      optional: Boolean(row.optional),
    });
  },
};
