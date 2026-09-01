/** CAPA DE DOMINIO — Entidad Ingredient (catalogo maestro). */
export const Category = Object.freeze({
  VEGETABLES: 'Verduras',
  DAIRY: 'Lacteos',
  MEAT: 'Carnes',
  DRY: 'Despensa seca',
  OTHER: 'Otros',
});

export const Unit = Object.freeze({ G: 'g', ML: 'ml', PZA: 'pza' });

export class Ingredient {
  constructor({ id = null, name, category = Category.OTHER, defaultUnit = Unit.G }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.defaultUnit = defaultUnit;
  }
}
