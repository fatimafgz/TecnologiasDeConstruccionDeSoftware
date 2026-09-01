/**
 * CAPA DE PERSISTENCIA — Fabrica de conexion SQLite (driver nativo de Node >= 22.5).
 * Unico punto del sistema que conoce el motor de base de datos.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createConnection(file = join(__dirname, '..', '..', '..', 'zerowaste.db')) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));
  return db;
}

/** Envuelve un bloque en una transaccion SQL (usado por CookingExecutionService). */
export function withTransaction(db, fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
