import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMealDbRecipe,
  normalizeFoodProduct,
  externalService,
} from '../src/presentation/public/js/externalService.js';

test('externalService: normalizeMealDbRecipe parsea ingredientes, medidas y metadatos correctamente', () => {
  const rawMeal = {
    idMeal: '52772',
    strMeal: 'Teriyaki Chicken Casserole',
    strCategory: 'Chicken',
    strArea: 'Japanese',
    strInstructions: 'Preheat oven to 350° F. Spray a 9x13-inch baking dish with non-stick spray.',
    strMealThumb: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
    strTags: 'Meat,Casserole',
    strYoutube: 'https://www.youtube.com/watch?v=4aZr5hZXP_s',
    strSource: 'https://www.thespruceeats.com/teriyaki-chicken-casserole-recipe-4775481',
    strIngredient1: 'soy sauce',
    strMeasure1: '3/4 cup',
    strIngredient2: 'water',
    strMeasure2: '1/2 cup',
    strIngredient3: 'brown sugar',
    strMeasure3: '1/4 cup',
    strIngredient4: '',
    strMeasure4: '',
  };

  const normalized = normalizeMealDbRecipe(rawMeal);

  assert.equal(normalized.id, '52772');
  assert.equal(normalized.title, 'Teriyaki Chicken Casserole');
  assert.equal(normalized.category, 'Chicken');
  assert.equal(normalized.area, 'Japanese');
  assert.equal(normalized.tags.length, 2);
  assert.deepEqual(normalized.tags, ['Meat', 'Casserole']);
  assert.equal(normalized.ingredients.length, 3);
  assert.equal(normalized.ingredients[0].name, 'soy sauce');
  assert.equal(normalized.ingredients[0].measure, '3/4 cup');
  assert.equal(normalized.youtubeUrl, 'https://www.youtube.com/watch?v=4aZr5hZXP_s');
});

test('externalService: normalizeMealDbRecipe maneja objetos nulos o vacíos', () => {
  assert.equal(normalizeMealDbRecipe(null), null);
  assert.equal(normalizeMealDbRecipe(undefined), null);

  const minimal = normalizeMealDbRecipe({ idMeal: '1', strMeal: 'Test' });
  assert.equal(minimal.id, '1');
  assert.equal(minimal.title, 'Test');
  assert.equal(minimal.category, 'General');
  assert.deepEqual(minimal.ingredients, []);
  assert.deepEqual(minimal.tags, []);
});

test('externalService: normalizeFoodProduct extrae Nutri-Score, Eco-Score y CO2', () => {
  const rawProduct = {
    code: '8480000123456',
    product_name: 'Espinacas Frescas Lavadas',
    brands: 'Hacendado',
    nutriscore_grade: 'a',
    ecoscore_grade: 'b',
    ecoscore_data: {
      agribalyse: {
        co2_total: 0.42,
      },
    },
    image_front_small_url: 'https://images.openfoodfacts.org/thumb.jpg',
    categories: 'Plant-based foods, Fruits and vegetables, Vegetables, Fresh vegetables, Spinach',
  };

  const norm = normalizeFoodProduct(rawProduct);

  assert.equal(norm.code, '8480000123456');
  assert.equal(norm.name, 'Espinacas Frescas Lavadas');
  assert.equal(norm.brand, 'Hacendado');
  assert.equal(norm.nutriscore, 'A');
  assert.equal(norm.ecoscore, 'B');
  assert.equal(norm.co2Kg, '0.42');
  assert.equal(norm.image, 'https://images.openfoodfacts.org/thumb.jpg');
});

test('externalService: validación de entrada en métodos del cliente', async () => {
  // Búsqueda vacía debe retornar arreglo vacío sin lanzar error
  const emptyRes = await externalService.searchRecipes('');
  assert.deepEqual(emptyRes, []);

  const emptyIngRes = await externalService.getRecipesByIngredient('');
  assert.deepEqual(emptyIngRes, []);

  const emptyFacts = await externalService.searchFoodFacts('');
  assert.deepEqual(emptyFacts, []);

  // getRecipeDetails sin ID debe lanzar error
  await assert.rejects(
    () => externalService.getRecipeDetails(null),
    /ID de receta requerido/
  );
});
