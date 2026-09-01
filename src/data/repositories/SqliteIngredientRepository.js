/** CAPA DE ACCESO A DATOS — Implementacion SQLite de IIngredientRepository. */
import { IIngredientRepository } from './interfaces.js';
import { IngredientMapper } from '../mappers/IngredientMapper.js';

export class SqliteIngredientRepository extends IIngredientRepository {
  constructor(db) { super(); this.db = db; }

  findAll() {
    return this.db.prepare('SELECT * FROM ingredients ORDER BY name')
      .all().map(IngredientMapper.toDomain);
  }

  findById(id) {
    return IngredientMapper.toDomain(
      this.db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id));
  }

  findByName(name) {
    return IngredientMapper.toDomain(
      this.db.prepare('SELECT * FROM ingredients WHERE lower(name) = lower(?)').get(name));
  }

  create({ name, category, defaultUnit }) {
    const info = this.db
      .prepare('INSERT INTO ingredients (name, category, default_unit) VALUES (?, ?, ?)')
      .run(name, category, defaultUnit);
    return this.findById(Number(info.lastInsertRowid));
  }

  findOrCreateByName(name, category = 'Otros', defaultUnit = 'g') {
    return this.findByName(name) ?? this.create({ name, category, defaultUnit });
  }
}
