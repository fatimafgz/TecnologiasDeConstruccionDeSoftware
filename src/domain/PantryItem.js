import { daysUntil, levelForDays, URGENCY_WEIGHT, isAtRisk } from './Urgency.js';

/**
 * CAPA DE DOMINIO — Entidad PantryItem (lote concreto en la despensa).
 * Un mismo ingrediente puede tener varios lotes con distintas caducidades.
 */
export class PantryItem {
  constructor({ id = null, ingredientId, ingredientName = null, category = null,
                quantity, unit, expiryDate, addedAt = new Date().toISOString() }) {
    this.id = id;
    this.ingredientId = ingredientId;
    this.ingredientName = ingredientName;
    this.category = category;
    this.quantity = Number(quantity);
    this.unit = unit;
    this.expiryDate = expiryDate;      // ISO 'YYYY-MM-DD'
    this.addedAt = addedAt;
  }

  daysLeft(now = new Date()) { return daysUntil(this.expiryDate, now); }
  urgency(now = new Date()) { return levelForDays(this.daysLeft(now)); }
  urgencyWeight(now = new Date()) { return URGENCY_WEIGHT[this.urgency(now)]; }
  isAtRisk(now = new Date()) { return isAtRisk(this.urgency(now)); }

  /** Descuenta cantidad de este lote; devuelve lo que NO pudo cubrir. */
  consume(amount) {
    const taken = Math.min(this.quantity, amount);
    this.quantity = Number((this.quantity - taken).toFixed(3));
    return Number((amount - taken).toFixed(3));
  }

  isEmpty() { return this.quantity <= 0.0001; }
}
