/**
 * Tests de la CAPA DE NEGOCIO sobre una BD temporal.
 * Demuestran que los servicios son testeables de forma aislada:
 * el reloj y la persistencia se inyectan.
 *
 * Ejecutar:  npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';

import { buildContainer } from '../src/composition.js';
import { levelForDays, UrgencyLevel } from '../src/domain/Urgency.js';
import { InsufficientStockError, ValidationError } from '../src/business/errors.js';

const dbFile = join(tmpdir(), `zw-test-${Date.now()}.db`);
const FIXED_NOW = new Date('2026-06-10T12:00:00Z');
const { db, repositories, services } = buildContainer({ dbFile, clock: () => FIXED_NOW });

test.after(() => { db.close(); rmSync(dbFile, { force: true }); });

/* --------------------------- Dominio: urgencia --------------------------- */
test('semaforo de caducidad segun dias restantes', () => {
  assert.equal(levelForDays(9), UrgencyLevel.FRESH);
  assert.equal(levelForDays(5), UrgencyLevel.FRESH);
  assert.equal(levelForDays(4), UrgencyLevel.SOON);
  assert.equal(levelForDays(2), UrgencyLevel.SOON);
  assert.equal(levelForDays(1), UrgencyLevel.URGENT);
  assert.equal(levelForDays(0), UrgencyLevel.URGENT);
  assert.equal(levelForDays(-1), UrgencyLevel.EXPIRED);
});

/* ------------------------------ PantryService ---------------------------- */
test('PantryService rechaza datos invalidos', () => {
  assert.throws(
    () => services.pantryService.addItem({ name: '', quantity: 0, unit: 'kg', expiryDate: 'x' }),
    ValidationError);
});

test('PantryService etiqueta urgencia y dias restantes', () => {
  const item = services.pantryService.addItem({
    name: 'Espinaca', category: 'Verduras', quantity: 300, unit: 'g', expiryDate: '2026-06-11',
  });
  assert.equal(item.daysLeft, 1);
  assert.equal(item.urgency, UrgencyLevel.URGENT);
  assert.equal(item.atRisk, true);
});

/* --------------------------- PortionScalingService ----------------------- */
test('PortionScalingService escala cantidades por comensales', () => {
  const ing = repositories.ingredientRepository;
  const espinaca = ing.findByName('Espinaca');
  const arroz = ing.findOrCreateByName('Arroz', 'Despensa seca', 'g');
  const huevo = ing.findOrCreateByName('Huevo', 'Lacteos', 'pza');

  db.prepare(`INSERT INTO recipes (title, description, minutes, base_servings, steps)
              VALUES ('Salteado', '', 15, 2, '["Saltear"]')`).run();
  const rid = Number(db.prepare('SELECT id FROM recipes WHERE title = ?').get('Salteado').id);
  const line = db.prepare(`INSERT INTO recipe_ingredients
    (recipe_id, ingredient_id, quantity, unit, weight, optional) VALUES (?, ?, ?, ?, ?, 0)`);
  line.run(rid, espinaca.id, 200, 'g', 1);
  line.run(rid, arroz.id, 150, 'g', 0.6);
  line.run(rid, huevo.id, 1, 'pza', 0.4);

  const recipe = repositories.recipeRepository.findById(rid);
  const scaled = services.portionScalingService.scaleIngredients(recipe, 6);
  const byName = Object.fromEntries(scaled.map((s) => [s.name, s.quantity]));

  assert.equal(byName.Espinaca, 600);
  assert.equal(byName.Arroz, 450);
  assert.equal(byName.Huevo, 3);          // 'pza' redondea a entero
  assert.throws(() => services.portionScalingService.factor(recipe, 0), ValidationError);
});

/* --------------------------- RecipeMatchingService ----------------------- */
test('el Score prioriza recetas que usan ingredientes urgentes', () => {
  const [top] = services.recipeMatchingService.recommend({ servings: 2 });
  assert.equal(top.title, 'Salteado');
  assert.ok(top.score > 0, 'el score debe ser positivo');
  assert.equal(top.atRiskCount, 1);       // solo la espinaca esta en riesgo
  assert.match(top.highlight, /a punto de vencer/);
});

test('una receta sin stock suficiente se marca como no cocinable', () => {
  const detail = services.recipeMatchingService.detail(
    repositories.recipeRepository.findAll()[0].id, 6);
  assert.equal(detail.cookable, false);   // 600 g de espinaca > 300 g disponibles
  assert.ok(detail.missing.length > 0);
});

/* -------------------------- CookingExecutionService ---------------------- */
test('cocinar descuenta las cantidades exactas y registra la bitacora', () => {
  const recipe = repositories.recipeRepository.findAll()[0];

  // Falta arroz/huevo suficiente: primero se abastece la despensa.
  services.pantryService.addItem({ name: 'Arroz', category: 'Despensa seca', quantity: 500, unit: 'g', expiryDate: '2027-01-01' });
  services.pantryService.addItem({ name: 'Huevo', category: 'Lacteos', quantity: 6, unit: 'pza', expiryDate: '2026-06-20' });

  const { log, message } = services.cookingExecutionService.cook({ recipeId: recipe.id, servings: 2 });

  const espinaca = services.pantryService.listPantry().find((i) => i.name === 'Espinaca');
  assert.equal(espinaca.quantity, 100);   // 300 - 200
  assert.equal(log.servings, 2);
  assert.equal(log.savedItems, 1);        // rescato el lote urgente de espinaca
  assert.match(message, /Rescataste/);
});

test('cocinar sin stock lanza InsufficientStockError y NO toca la despensa', () => {
  const recipe = repositories.recipeRepository.findAll()[0];
  const antes = services.pantryService.listPantry().map((i) => `${i.name}:${i.quantity}`).join('|');

  assert.throws(
    () => services.cookingExecutionService.cook({ recipeId: recipe.id, servings: 6 }),
    InsufficientStockError);

  const despues = services.pantryService.listPantry().map((i) => `${i.name}:${i.quantity}`).join('|');
  assert.equal(despues, antes, 'la despensa debe quedar intacta');
});
