/**
 * Tests para el Módulo de Internacionalización (i18n).
 *
 * Ejecutar:  agy-node --test tests/i18n.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { translations, createI18nManager } from '../src/presentation/public/js/i18n.js';

test('i18n: los diccionarios es y en contienen las secciones principales y de errores', () => {
  assert.ok(translations.es);
  assert.ok(translations.en);

  const sections = ['app', 'errors', 'tabs', 'pantry', 'categories', 'urgency', 'ingredients', 'recipes', 'recipesCatalog', 'modal', 'history', 'feedback', 'external', 'websocket'];
  for (const s of sections) {
    assert.ok(translations.es[s], `Falta la sección ${s} en español`);
    assert.ok(translations.en[s], `Falta la sección ${s} en inglés`);
  }

  assert.equal(translations.es.app.selectLang, 'Idioma');
  assert.equal(translations.en.app.selectLang, 'Language');

  const errorKeys = ['nameRequired', 'nameInvalid', 'quantityRequired', 'quantityInvalid', 'expiryRequired', 'expiryInvalid', 'formHasErrors'];
  for (const k of errorKeys) {
    assert.ok(typeof translations.es.errors[k] === 'string', `Falta translations.es.errors.${k}`);
    assert.ok(typeof translations.en.errors[k] === 'string', `Falta translations.en.errors.${k}`);
  }
});

test('i18n: interpolación correcta de parámetros dinámicos', () => {
  const i18n = createI18nManager('es');

  const strEs = i18n.t('recipes.usesRisk', { count: 3, plural: 's' });
  assert.equal(strEs, 'Usa 3 ingredientes a punto de vencer');

  i18n.setLang('en');
  const strEn = i18n.t('recipes.usesRisk', { count: 1, plural: '' });
  assert.equal(strEn, 'Uses 1 ingredient about to expire');
});

test('i18n: traducción de catálogo de ingredientes (es / en)', () => {
  const i18n = createI18nManager('es');
  assert.equal(i18n.translateIngredient('Espinaca'), 'Espinaca');
  assert.equal(i18n.translateIngredient('Pechuga de pollo'), 'Pechuga de pollo');

  i18n.setLang('en');
  assert.equal(i18n.translateIngredient('Espinaca'), 'Spinach');
  assert.equal(i18n.translateIngredient('Pechuga de pollo'), 'Chicken Breast');
  assert.equal(i18n.translateIngredient('Champinones'), 'Mushrooms');
  assert.equal(i18n.translateIngredient('Queso parmesano'), 'Parmesan Cheese');

  // Fallback para ingredientes personalizados fuera del catálogo
  assert.equal(i18n.translateIngredient('Maracuyá'), 'Maracuyá');
});

test('i18n: traducción completa de recetas (títulos, descripciones y pasos)', () => {
  const i18n = createI18nManager('es');
  const titleOrig = 'Crema de espinaca y champinones';

  assert.equal(i18n.translateRecipeTitle(titleOrig), 'Crema de espinaca y champiñones');

  i18n.setLang('en');
  assert.equal(i18n.translateRecipeTitle(titleOrig), 'Spinach and Mushroom Cream Soup');
  assert.equal(i18n.translateRecipeDescription(titleOrig).includes('leafy greens'), true);

  const steps = i18n.translateRecipeSteps(titleOrig);
  assert.equal(steps.length, 4);
  assert.equal(steps[0], 'Sauté onion and garlic in butter.');
});
