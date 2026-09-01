/** CAPA DE ACCESO A DATOS — Implementacion SQLite de IRecipeRepository. */
import { IRecipeRepository } from './interfaces.js';
import { RecipeMapper } from '../mappers/RecipeMapper.js';

const SELECT_LINES = `
  SELECT ri.*, i.name AS ingredient_name
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
   WHERE ri.recipe_id = ?
   ORDER BY ri.weight DESC, i.name`;

export class SqliteRecipeRepository extends IRecipeRepository {
  constructor(db) { super(); this.db = db; }

  findAll() {
    const rows = this.db.prepare('SELECT * FROM recipes ORDER BY title').all();
    const lines = this.db.prepare(`
      SELECT ri.*, i.name AS ingredient_name
        FROM recipe_ingredients ri
        JOIN ingredients i ON i.id = ri.ingredient_id`).all();
    const byRecipe = new Map();
    for (const l of lines) {
      if (!byRecipe.has(l.recipe_id)) byRecipe.set(l.recipe_id, []);
      byRecipe.get(l.recipe_id).push(l);
    }
    return rows.map((r) => RecipeMapper.toDomain(r, byRecipe.get(r.id) ?? []));
  }

  findById(id) {
    const row = this.db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
    if (!row) return null;
    return RecipeMapper.toDomain(row, this.db.prepare(SELECT_LINES).all(id));
  }
}
