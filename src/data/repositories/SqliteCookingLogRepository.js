/** CAPA DE ACCESO A DATOS — Implementacion SQLite de ICookingLogRepository. */
import { ICookingLogRepository } from './interfaces.js';
import { CookingLogMapper } from '../mappers/CookingLogMapper.js';

export class SqliteCookingLogRepository extends ICookingLogRepository {
  constructor(db) { super(); this.db = db; }

  add(log) {
    const info = this.db
      .prepare(`INSERT INTO cooking_logs (recipe_id, servings, consumed, saved_items)
                VALUES (?, ?, ?, ?)`)
      .run(log.recipeId, log.servings, JSON.stringify(log.consumed), log.savedItems);
    return this.findById(Number(info.lastInsertRowid));
  }

  findById(id) {
    return CookingLogMapper.toDomain(this.db.prepare(`
      SELECT c.*, r.title AS recipe_title
        FROM cooking_logs c JOIN recipes r ON r.id = c.recipe_id
       WHERE c.id = ?`).get(id));
  }

  findRecent(limit = 20) {
    return this.db.prepare(`
      SELECT c.*, r.title AS recipe_title
        FROM cooking_logs c JOIN recipes r ON r.id = c.recipe_id
       ORDER BY c.cooked_at DESC, c.id DESC LIMIT ?`)
      .all(limit).map(CookingLogMapper.toDomain);
  }
}
