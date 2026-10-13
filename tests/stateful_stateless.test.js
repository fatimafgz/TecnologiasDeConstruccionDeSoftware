/**
 * Tests exhaustivos para las 2 FUNCIONES STATELESS y 2 FUNCIONES STATEFUL.
 *
 * Ejecutar:  agy-node --test tests/stateful_stateless.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateEcoImpact, calculateShoppingListDiff } from '../src/domain/statelessFunctions.js';
import { createFavoritesTracker, createWasteSavingsTracker } from '../src/business/statefulFunctions.js';

/* =========================================================================
   1. PRUEBAS PARA FUNCIONES STATELESS (Puras / Sin Estado)
   ========================================================================= */

test('[STATELESS 1] calculateEcoImpact: cálculo determinista del impacto ambiental', () => {
  const items = [
    { ingredientName: 'Espinaca', category: 'Verduras', quantity: 500, unit: 'g' },     // 0.5 kg * 1.5 = 0.75 kg CO2, 150 L, 1.4 €
    { ingredientName: 'Leche', category: 'Lacteos', quantity: 1000, unit: 'ml' },        // 1.0 kg * 4.2 = 4.2 kg CO2, 1000 L, 4.5 €
    { ingredientName: 'Pollo', category: 'Carnes', quantity: 250, unit: 'g' },           // 0.25 kg * 14.0 = 3.5 kg CO2, 1000 L, 2.75 €
  ];

  // Invocación 1
  const result1 = calculateEcoImpact(items);

  // Invocación 2 con los mismos datos
  const result2 = calculateEcoImpact(items);

  // Determinismo estricto: result1 y result2 deben ser idénticos
  assert.deepEqual(result1, result2, 'Una función stateless debe devolver resultados idénticos para entradas iguales');

  // Validar cálculos esperados
  assert.equal(result1.co2AvoidedKg, 8.45);        // 0.75 + 4.2 + 3.5 = 8.45
  assert.equal(result1.waterSavedLiters, 2150);     // 150 + 1000 + 1000 = 2150
  assert.equal(result1.moneySavedEur, 8.65);        // 1.4 + 4.5 + 2.75 = 8.65
  assert.equal(result1.totalWeightGrams, 1750);
  assert.equal(result1.formatted.co2, '8.45 kg CO₂');
});

test('[STATELESS 1] calculateEcoImpact: inmutabilidad y valores vacíos', () => {
  const originalItems = [
    { ingredientName: 'Huevo', category: 'Lacteos', quantity: 2, unit: 'pza' },
  ];
  const copyBefore = JSON.stringify(originalItems);

  const result = calculateEcoImpact(originalItems);
  const copyAfter = JSON.stringify(originalItems);

  // Garantizar que la función pura NO mutó los argumentos de entrada
  assert.equal(copyBefore, copyAfter, 'La función stateless no debe mutar los arreglos u objetos recibidos');
  assert.ok(result.co2AvoidedKg > 0);

  // Caso borde: entrada vacía o inválida
  const emptyResult = calculateEcoImpact([]);
  assert.equal(emptyResult.co2AvoidedKg, 0);
  assert.equal(emptyResult.waterSavedLiters, 0);
  assert.equal(emptyResult.moneySavedEur, 0);
});

test('[STATELESS 2] calculateShoppingListDiff: cálculo funcional de lista de compras y cobertura', () => {
  const required = [
    { ingredientId: 1, name: 'Arroz', quantity: 300, unit: 'g', optional: false },
    { ingredientId: 2, name: 'Tomate', quantity: 200, unit: 'g', optional: false },
    { ingredientId: 3, name: 'Cilantro', quantity: 20, unit: 'g', optional: true },
  ];

  const pantryStock = [
    { ingredientId: 1, name: 'Arroz', quantity: 100, unit: 'g' }, // Faltan 200g
    { ingredientId: 2, name: 'Tomate', quantity: 500, unit: 'g' }, // Cubierto (sobran 300g)
    // Cilantro no está en despensa pero es opcional
  ];

  const diff = calculateShoppingListDiff(required, pantryStock);

  // Verificaciones
  assert.equal(diff.canCook, false, 'No se puede cocinar porque falta arroz obligatorio');
  assert.equal(diff.coveragePercentage, 50, '1 de 2 obligatorios está cubierto = 50%');

  assert.equal(diff.covered.length, 1);
  assert.equal(diff.covered[0].name, 'Tomate');
  assert.equal(diff.covered[0].available, 500);

  assert.equal(diff.missing.length, 2); // Arroz (obligatorio) y Cilantro (opcional)
  const arrozMissing = diff.missing.find((m) => m.name === 'Arroz');
  assert.equal(arrozMissing.shortBy, 200);
  assert.equal(arrozMissing.optional, false);

  const cilantroMissing = diff.missing.find((m) => m.name === 'Cilantro');
  assert.equal(cilantroMissing.shortBy, 20);
  assert.equal(cilantroMissing.optional, true);
});

test('[STATELESS 2] calculateShoppingListDiff: determinismo e inmutabilidad con despensa completa', () => {
  const required = [
    { name: 'Huevos', quantity: 2, unit: 'pza' },
    { name: 'Aceite', quantity: 10, unit: 'ml' },
  ];
  const stock = [
    { name: 'Huevos', quantity: 6, unit: 'pza' },
    { name: 'Aceite', quantity: 500, unit: 'ml' },
  ];

  const beforeReq = JSON.stringify(required);
  const beforeStock = JSON.stringify(stock);

  const res1 = calculateShoppingListDiff(required, stock);
  const res2 = calculateShoppingListDiff(required, stock);

  // Inmutabilidad
  assert.equal(beforeReq, JSON.stringify(required));
  assert.equal(beforeStock, JSON.stringify(stock));

  // Determinismo
  assert.deepEqual(res1, res2);
  assert.equal(res1.canCook, true);
  assert.equal(res1.coveragePercentage, 100);
  assert.equal(res1.missing.length, 0);
  assert.equal(res1.covered.length, 2);
});


/* =========================================================================
   2. PRUEBAS PARA FUNCIONES STATEFUL (Con Estado / Con Memoria)
   ========================================================================= */

test('[STATEFUL 1] createFavoritesTracker: gestión de estado persistente e histórico', () => {
  const tracker = createFavoritesTracker([10, 20]);

  // Estado inicial
  assert.equal(tracker.count(), 2);
  assert.equal(tracker.isFavorite(10), true);
  assert.equal(tracker.isFavorite(30), false);

  // 1ª Conmutación (toggle): añadir 30 -> cambia el estado interno
  const added = tracker.toggle(30);
  assert.equal(added, true);
  assert.equal(tracker.isFavorite(30), true, 'El estado interno cambió: 30 ahora es favorito');
  assert.equal(tracker.count(), 3);

  // 2ª Conmutación (toggle): remover 30 -> vuelve a cambiar el estado interno
  const removed = tracker.toggle(30);
  assert.equal(removed, false);
  assert.equal(tracker.isFavorite(30), false, 'El estado interno cambió: 30 ya no es favorito');
  assert.equal(tracker.count(), 2);

  // Agregar y remover explícito
  assert.equal(tracker.add(40), true);
  assert.equal(tracker.add(40), false, 'Ya estaba presente');
  assert.equal(tracker.remove(10), true);
  assert.equal(tracker.isFavorite(10), false);

  // Instantánea completa del estado
  assert.deepEqual(tracker.getAll().sort((a, b) => a - b), [20, 40]);

  // Limpiar estado
  tracker.clear();
  assert.equal(tracker.count(), 0);
  assert.deepEqual(tracker.getAll(), []);
});

test('[STATEFUL 1] createFavoritesTracker: aislamiento de instancias con estado independiente', () => {
  const trackerA = createFavoritesTracker();
  const trackerB = createFavoritesTracker();

  trackerA.add(1);
  trackerA.add(2);

  trackerB.add(99);

  // Cada instancia debe poseer su propio estado encapsulado
  assert.equal(trackerA.count(), 2);
  assert.equal(trackerB.count(), 1);
  assert.equal(trackerA.isFavorite(99), false);
  assert.equal(trackerB.isFavorite(1), false);
});

test('[STATEFUL 2] createWasteSavingsTracker: acumulador de métricas de sesión con estado', () => {
  const tracker = createWasteSavingsTracker();

  // Estado inicial
  assert.deepEqual(tracker.getSummary(), {
    totalCooked: 0,
    totalSavedItems: 0,
    totalCo2AvoidedKg: 0,
    totalWaterSavedLiters: 0,
    totalMoneySavedEur: 0,
    streak: 0,
  });

  // Registro 1: Cocinar receta con rescate de 2 lotes en riesgo
  tracker.recordCook({
    recipeTitle: 'Sopa de verduras',
    servings: 2,
    savedItems: 2,
    co2AvoidedKg: 1.5,
    waterSavedLiters: 350,
    moneySavedEur: 4.2,
  });

  let summary = tracker.getSummary();
  assert.equal(summary.totalCooked, 1);
  assert.equal(summary.totalSavedItems, 2);
  assert.equal(summary.totalCo2AvoidedKg, 1.5);
  assert.equal(summary.totalWaterSavedLiters, 350);
  assert.equal(summary.totalMoneySavedEur, 4.2);
  assert.equal(summary.streak, 1);

  // Registro 2: Cocinar otra receta acumulando al estado previo
  tracker.recordCook({
    recipeTitle: 'Tortilla de patatas',
    servings: 4,
    savedItems: 1,
    co2AvoidedKg: 0.8,
    waterSavedLiters: 120,
    moneySavedEur: 2.1,
  });

  summary = tracker.getSummary();
  assert.equal(summary.totalCooked, 2);
  assert.equal(summary.totalSavedItems, 3);
  assert.equal(summary.totalCo2AvoidedKg, 2.3);       // 1.5 + 0.8
  assert.equal(summary.totalWaterSavedLiters, 470);   // 350 + 120
  assert.equal(summary.totalMoneySavedEur, 6.3);      // 4.2 + 2.1
  assert.equal(summary.streak, 2);                   // Racha continúa

  // Registro 3: Cocinar receta sin rescate (savedItems = 0) -> rompe la racha
  tracker.recordCook({
    recipeTitle: 'Arroz blanco',
    servings: 1,
    savedItems: 0,
    co2AvoidedKg: 0.2,
    waterSavedLiters: 50,
    moneySavedEur: 0.5,
  });

  summary = tracker.getSummary();
  assert.equal(summary.totalCooked, 3);
  assert.equal(summary.streak, 0, 'La racha se reinicia cuando no se rescatan alimentos');

  // Historial de eventos guardado en el estado
  const history = tracker.getHistory();
  assert.equal(history.length, 3);
  assert.equal(history[0].recipeTitle, 'Sopa de verduras');
  assert.equal(history[1].recipeTitle, 'Tortilla de patatas');
  assert.equal(history[2].recipeTitle, 'Arroz blanco');

  // Reiniciar estado
  tracker.reset();
  assert.equal(tracker.getSummary().totalCooked, 0);
  assert.equal(tracker.getHistory().length, 0);
});
