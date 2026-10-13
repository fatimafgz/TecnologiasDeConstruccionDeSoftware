/**
 * CAPA DE LOGICA DE NEGOCIO — PantryService.
 * Validacion de fechas, calculo de dias restantes y etiquetado de urgencia.
 */
import { PantryItem } from '../domain/PantryItem.js';
import { Category, Unit } from '../domain/Ingredient.js';
import { URGENCY_UI, UrgencyLevel } from '../domain/Urgency.js';
import { ValidationError, NotFoundError } from './errors.js';

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/;
const QUANTITY_REGEX = /^(?:[1-9]\d*|0)(?:\.\d{1,2})?$/;
const ISO_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export class PantryService {
  constructor({ pantryRepository, ingredientRepository, clock = () => new Date() }) {
    this.pantry = pantryRepository;
    this.ingredients = ingredientRepository;
    this.clock = clock;
  }

  /** Vista de despensa etiquetada y ordenada por urgencia. */
  listPantry({ category = null } = {}) {
    const now = this.clock();
    let items = this.pantry.findAll().map((item) => this.#decorate(item, now));
    if (category && category !== 'Todas') items = items.filter((i) => i.category === category);
    return items;
  }

  getSummary() {
    const items = this.listPantry();
    const count = (lvl) => items.filter((i) => i.urgency === lvl).length;
    return {
      total: items.length,
      fresh: count(UrgencyLevel.FRESH),
      soon: count(UrgencyLevel.SOON),
      urgent: count(UrgencyLevel.URGENT),
      expired: count(UrgencyLevel.EXPIRED),
      atRisk: items.filter((i) => i.atRisk).length,
    };
  }

  addItem({ name, category, quantity, unit, expiryDate }) {
    this.#validate({ name, quantity, unit, expiryDate });
    const ingredient = this.ingredients.findOrCreateByName(
      name.trim(), category ?? Category.OTHER, unit);
    const saved = this.pantry.add(new PantryItem({
      ingredientId: ingredient.id,
      quantity: Number(quantity),
      unit,
      expiryDate,
    }));
    return this.#decorate(saved, this.clock());
  }

  updateQuantity(id, quantity) {
    if (!(Number(quantity) >= 0)) throw new ValidationError('La cantidad no puede ser negativa');
    if (!this.pantry.findById(id)) throw new NotFoundError(`Lote ${id} no encontrado`);
    return this.#decorate(this.pantry.updateQuantity(id, Number(quantity)), this.clock());
  }

  removeItem(id) {
    if (!this.pantry.remove(id)) throw new NotFoundError(`Lote ${id} no encontrado`);
    return { removed: id };
  }

  listCategories() { return ['Todas', ...Object.values(Category)]; }

  #validate({ name, quantity, unit, expiryDate }) {
    const errors = {};
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      errors.name = 'El nombre del ingrediente es obligatorio';
    } else if (!NAME_REGEX.test(trimmedName)) {
      errors.name = 'El nombre debe contener solo letras y espacios (2 a 50 caracteres)';
    }

    const qtyStr = String(quantity ?? '').trim();
    if (!qtyStr || !QUANTITY_REGEX.test(qtyStr) || !(Number(qtyStr) > 0)) {
      errors.quantity = 'La cantidad debe ser un numero positivo valido';
    }

    if (!Object.values(Unit).includes(unit)) {
      errors.unit = `Unidad invalida (g, ml o pza)`;
    }

    if (!ISO_DATE_REGEX.test(String(expiryDate ?? '').trim()) || Number.isNaN(Date.parse(expiryDate))) {
      errors.expiryDate = 'Fecha de caducidad invalida (formato AAAA-MM-DD)';
    }

    if (Object.keys(errors).length) {
      throw new ValidationError('Datos de ingrediente invalidos', errors);
    }
  }

  /** Enriquece la entidad con los datos derivados que consume la UI. */
  #decorate(item, now) {
    const daysLeft = item.daysLeft(now);
    const urgency = item.urgency(now);
    return {
      id: item.id,
      ingredientId: item.ingredientId,
      name: item.ingredientName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate,
      daysLeft,
      urgency,
      atRisk: item.isAtRisk(now),
      badge: URGENCY_UI[urgency],
      expiryText: daysLeft < 0
        ? `Vencido hace ${Math.abs(daysLeft)} d`
        : daysLeft === 0 ? 'Vence hoy'
        : daysLeft === 1 ? 'Vence manana'
        : `${daysLeft} dias`,
    };
  }
}
