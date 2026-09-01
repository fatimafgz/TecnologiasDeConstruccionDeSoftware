/** CAPA DE DOMINIO — Entidad Recipe (agregado raiz con sus lineas). */
export class Recipe {
  constructor({ id = null, title, description = '', minutes = 0,
                baseServings = 2, steps = [], ingredients = [] }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.minutes = minutes;
    this.baseServings = baseServings;
    this.steps = steps;             // string[]
    this.ingredients = ingredients; // RecipeIngredient[]
  }

  requiredIngredients() { return this.ingredients.filter((i) => !i.optional); }
}
