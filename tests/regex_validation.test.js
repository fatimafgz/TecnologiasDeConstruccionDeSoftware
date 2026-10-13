import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REGEX_PATTERNS,
  validateIngredientName,
  validateQuantity,
  validateExpiryDate,
  validatePantryForm,
} from '../src/presentation/public/js/validators.js';
import { PantryService } from '../src/business/PantryService.js';
import { ValidationError } from '../src/business/errors.js';

test('Regex: NAME_REGEX valida nombres con tildes, ñ, ü y espacios', () => {
  const validNames = [
    'Tomate',
    'Espinaca fresca',
    'Pechuga de pollo',
    'Champiñones',
    'Queso parmesano',
    'Zanahoria baby',
    'Papas criollas',
    'Ñame blanco',
    'Güisqui cocido',
    'Pan',
  ];

  for (const name of validNames) {
    const res = validateIngredientName(name);
    assert.equal(res.isValid, true, `Debería ser válido: "${name}"`);
    assert.equal(res.errorKey, null);
  }
});

test('Regex: NAME_REGEX rechaza números, caracteres especiales y longitudes fuera de rango', () => {
  const invalidNames = [
    '',
    '   ',
    'A', // muy corto (< 2 caracteres)
    'Tomate 123', // contiene números
    'Pollo!', // contiene signos de puntuación
    'Espinaca #1', // contiene símbolos
    '<script>alert(1)</script>', // inyección / tags
    'a'.repeat(51), // muy largo (> 50 caracteres)
    null,
    undefined,
  ];

  for (const name of invalidNames) {
    const res = validateIngredientName(name);
    assert.equal(res.isValid, false, `Debería ser inválido: "${name}"`);
    assert.ok(res.errorKey === 'errors.nameRequired' || res.errorKey === 'errors.nameInvalid');
  }
});

test('Regex: QUANTITY_REGEX valida enteros y números decimales positivos hasta 2 decimales', () => {
  const validQuantities = [
    1,
    250,
    '500',
    '1.5',
    '0.25',
    '10.75',
    '1000',
    0.5,
    '99.99',
  ];

  for (const qty of validQuantities) {
    const res = validateQuantity(qty);
    assert.equal(res.isValid, true, `Debería ser cantidad válida: "${qty}"`);
    assert.equal(res.errorKey, null);
  }
});

test('Regex: QUANTITY_REGEX rechaza números negativos, cero, texto y decimales excesivos', () => {
  const invalidQuantities = [
    0,
    '0',
    -5,
    '-10',
    '-0.5',
    'abc',
    '12.345', // más de 2 decimales
    '1..5',
    '2,5', // coma en lugar de punto
    '',
    '   ',
    null,
    undefined,
  ];

  for (const qty of invalidQuantities) {
    const res = validateQuantity(qty);
    assert.equal(res.isValid, false, `Debería ser cantidad inválida: "${qty}"`);
    assert.ok(res.errorKey === 'errors.quantityRequired' || res.errorKey === 'errors.quantityInvalid');
  }
});

test('Regex: EXPIRY_DATE_REGEX valida formato ISO YYYY-MM-DD con meses y días válidos', () => {
  const validDates = [
    '2026-09-30',
    '2026-01-01',
    '2026-12-31',
    '2027-02-28',
    '2025-10-15',
  ];

  for (const d of validDates) {
    const res = validateExpiryDate(d);
    assert.equal(res.isValid, true, `Debería ser fecha válida: "${d}"`);
    assert.equal(res.errorKey, null);
  }
});

test('Regex: EXPIRY_DATE_REGEX rechaza formatos inválidos, meses > 12 o días > 31', () => {
  const invalidDates = [
    '2026-13-01', // mes 13 inválido
    '2026-00-15', // mes 00 inválido
    '2026-05-32', // día 32 inválido
    '2026-05-00', // día 00 inválido
    '2026/05/15', // diagonales
    '15-05-2026', // formato DD-MM-YYYY
    '2026-5-1',   // sin ceros iniciales
    'fecha',
    '',
    null,
    undefined,
  ];

  for (const d of invalidDates) {
    const res = validateExpiryDate(d);
    assert.equal(res.isValid, false, `Debería ser fecha inválida: "${d}"`);
    assert.ok(res.errorKey === 'errors.expiryRequired' || res.errorKey === 'errors.expiryInvalid');
  }
});

test('Regex: validatePantryForm valida el formulario completo', () => {
  const validPayload = {
    name: 'Zanahoria',
    category: 'Verduras',
    quantity: '250',
    unit: 'g',
    expiryDate: '2026-10-10',
  };
  const validResult = validatePantryForm(validPayload);
  assert.equal(validResult.isValid, true);
  assert.deepEqual(validResult.errors, {});

  const invalidPayload = {
    name: '123 Inválido',
    category: 'Inexistente',
    quantity: '-10',
    unit: 'kilos',
    expiryDate: '2026-99-99',
  };
  const invalidResult = validatePantryForm(invalidPayload);
  assert.equal(invalidResult.isValid, false);
  assert.equal(invalidResult.errors.name, 'errors.nameInvalid');
  assert.equal(invalidResult.errors.quantity, 'errors.quantityInvalid');
  assert.equal(invalidResult.errors.expiryDate, 'errors.expiryInvalid');
  assert.equal(invalidResult.errors.category, 'errors.categoryInvalid');
  assert.equal(invalidResult.errors.unit, 'errors.unitInvalid');
});

test('PantryService: rechaza ingredientes con nombres o cantidades que no cumplen el Regex', () => {
  const mockPantryRepo = {
    findAll: () => [],
    add: (item) => ({ ...item, id: 1 }),
  };
  const mockIngRepo = {
    findOrCreateByName: (name, category, unit) => ({ id: 1, name, category, unit }),
  };
  const service = new PantryService({
    pantryRepository: mockPantryRepo,
    ingredientRepository: mockIngRepo,
  });

  // Nombre con dígitos
  assert.throws(
    () => service.addItem({
      name: 'Espinaca 2000',
      category: 'Verduras',
      quantity: 100,
      unit: 'g',
      expiryDate: '2026-10-10',
    }),
    (err) => err instanceof ValidationError && err.details?.name !== undefined
  );

  // Cantidad inválida (negativa o formato no numérico)
  assert.throws(
    () => service.addItem({
      name: 'Tomate',
      category: 'Verduras',
      quantity: 'abc',
      unit: 'pza',
      expiryDate: '2026-10-10',
    }),
    (err) => err instanceof ValidationError && err.details?.quantity !== undefined
  );

  // Fecha con mes inválido (ej. mes 14)
  assert.throws(
    () => service.addItem({
      name: 'Tomate',
      category: 'Verduras',
      quantity: 2,
      unit: 'pza',
      expiryDate: '2026-14-10',
    }),
    (err) => err instanceof ValidationError && err.details?.expiryDate !== undefined
  );
});
