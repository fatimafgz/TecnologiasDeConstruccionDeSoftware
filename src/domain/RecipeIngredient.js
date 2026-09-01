/**
 * CAPA DE DOMINIO — Linea de receta.
 * `weight` = peso del ingrediente dentro de la receta (protagonismo, 0..1+).
 * Es el factor que multiplica la urgencia en el Matching Score.
 */
export class RecipeIngredient {
  constructor({ recipeId = null, ingredientId, ingredientName = null,
                quantity, unit, weight = 1, optional = false }) {
    this.recipeId = recipeId;
    this.ingredientId = ingredientId;
    this.ingredientName = ingredientName;
    this.quantity = Number(quantity);
    this.unit = unit;
    this.weight = Number(weight);
    this.optional = Boolean(optional);
  }
}
