/** CAPA DE DOMINIO — Registro inmutable de una receta cocinada. */
export class CookingLog {
  constructor({ id = null, recipeId, recipeTitle = null, servings,
                cookedAt = new Date().toISOString(), consumed = [], savedItems = 0 }) {
    this.id = id;
    this.recipeId = recipeId;
    this.recipeTitle = recipeTitle;
    this.servings = servings;
    this.cookedAt = cookedAt;
    this.consumed = consumed;       // [{ ingredientName, quantity, unit }]
    this.savedItems = savedItems;   // lotes en riesgo rescatados
  }
}
