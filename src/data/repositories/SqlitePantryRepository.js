/** CAPA DE ACCESO A DATOS — Implementacion SQLite de IPantryRepository. */
import { IPantryRepository } from './interfaces.js';
import { PantryItemMapper } from '../mappers/PantryItemMapper.js';

const SELECT_JOIN = `
  SELECT p.*, i.name AS ingredient_name, i.category AS category
    FROM pantry_items p
    JOIN ingredients  i ON i.id = p.ingredient_id`;

export class SqlitePantryRepository extends IPantryRepository {
  constructor(db) { super(); this.db = db; }

  /** Ordenado por urgencia de vencimiento (consulta desacoplada del negocio). */
  findAll() {
    return this.db.prepare(`${SELECT_JOIN} ORDER BY p.expiry_date ASC, i.name ASC`)
      .all().map(PantryItemMapper.toDomain);
  }

  findById(id) {
    return PantryItemMapper.toDomain(
      this.db.prepare(`${SELECT_JOIN} WHERE p.id = ?`).get(id));
  }

  /** FEFO: First Expired, First Out — clave para descontar al cocinar. */
  findByIngredientIdOrderedByExpiry(ingredientId) {
    return this.db
      .prepare(`${SELECT_JOIN} WHERE p.ingredient_id = ? AND p.quantity > 0
                ORDER BY p.expiry_date ASC`)
      .all(ingredientId).map(PantryItemMapper.toDomain);
  }

  add(item) {
    const row = PantryItemMapper.toPersistence(item);
    const info = this.db
      .prepare(`INSERT INTO pantry_items (ingredient_id, quantity, unit, expiry_date)
                VALUES (?, ?, ?, ?)`)
      .run(row.ingredient_id, row.quantity, row.unit, row.expiry_date);
    return this.findById(Number(info.lastInsertRowid));
  }

  updateQuantity(id, quantity) {
    this.db.prepare('UPDATE pantry_items SET quantity = ? WHERE id = ?').run(quantity, id);
    return this.findById(id);
  }

  remove(id) {
    return this.db.prepare('DELETE FROM pantry_items WHERE id = ?').run(id).changes > 0;
  }
}
