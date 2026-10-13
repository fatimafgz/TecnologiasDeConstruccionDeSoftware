/**
 * Módulo de validación mediante Expresiones Regulares (Regex).
 * Proporciona validadores puros para el lado cliente y reglas reutilizables.
 */

export const REGEX_PATTERNS = {
  // Solo letras (incluye tildes en español, ñ, ü) y espacios, longitud de 2 a 50 caracteres
  NAME: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/,

  // Números enteros o decimales positivos con hasta 2 cifras decimales (ej. 250, 0.5, 1.25)
  QUANTITY: /^(?:[1-9]\d*|0)(?:\.\d{1,2})?$/,

  // Formato estricto de fecha ISO AAAA-MM-DD (mes 01-12, día 01-31)
  EXPIRY_DATE: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,

  // Unidades válidas del catálogo
  UNIT: /^(g|ml|pza)$/,

  // Categorías admitidas
  CATEGORY: /^(Verduras|Lacteos|Carnes|Despensa seca|Otros)$/,
};

/**
 * Valida el nombre del ingrediente con NAME_REGEX.
 * @param {string} name
 * @returns {{ isValid: boolean, errorKey: string|null }}
 */
export function validateIngredientName(name) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) {
    return { isValid: false, errorKey: 'errors.nameRequired' };
  }
  if (!REGEX_PATTERNS.NAME.test(trimmed)) {
    return { isValid: false, errorKey: 'errors.nameInvalid' };
  }
  return { isValid: true, errorKey: null };
}

/**
 * Valida la cantidad usando QUANTITY_REGEX y comprobación numérica positiva.
 * @param {string|number} quantity
 * @returns {{ isValid: boolean, errorKey: string|null }}
 */
export function validateQuantity(quantity) {
  const str = String(quantity ?? '').trim();
  if (!str) {
    return { isValid: false, errorKey: 'errors.quantityRequired' };
  }
  if (!REGEX_PATTERNS.QUANTITY.test(str)) {
    return { isValid: false, errorKey: 'errors.quantityInvalid' };
  }
  const num = Number(str);
  if (!Number.isFinite(num) || num <= 0) {
    return { isValid: false, errorKey: 'errors.quantityInvalid' };
  }
  return { isValid: true, errorKey: null };
}

/**
 * Valida la fecha de caducidad con EXPIRY_DATE_REGEX y validación de calendario real.
 * @param {string} dateStr
 * @returns {{ isValid: boolean, errorKey: string|null }}
 */
export function validateExpiryDate(dateStr) {
  const str = typeof dateStr === 'string' ? dateStr.trim() : '';
  if (!str) {
    return { isValid: false, errorKey: 'errors.expiryRequired' };
  }
  if (!REGEX_PATTERNS.EXPIRY_DATE.test(str)) {
    return { isValid: false, errorKey: 'errors.expiryInvalid' };
  }
  const parsed = Date.parse(str);
  if (Number.isNaN(parsed)) {
    return { isValid: false, errorKey: 'errors.expiryInvalid' };
  }
  return { isValid: true, errorKey: null };
}

/**
 * Valida un formulario de alta de ingrediente de forma integral.
 * @param {{ name: string, category?: string, quantity: string|number, unit?: string, expiryDate: string }} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validatePantryForm(data) {
  const errors = {};

  const nameVal = validateIngredientName(data?.name);
  if (!nameVal.isValid) errors.name = nameVal.errorKey;

  const qtyVal = validateQuantity(data?.quantity);
  if (!qtyVal.isValid) errors.quantity = qtyVal.errorKey;

  const expVal = validateExpiryDate(data?.expiryDate);
  if (!expVal.isValid) errors.expiryDate = expVal.errorKey;

  if (data?.unit && !REGEX_PATTERNS.UNIT.test(String(data.unit))) {
    errors.unit = 'errors.unitInvalid';
  }

  if (data?.category && !REGEX_PATTERNS.CATEGORY.test(String(data.category))) {
    errors.category = 'errors.categoryInvalid';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
