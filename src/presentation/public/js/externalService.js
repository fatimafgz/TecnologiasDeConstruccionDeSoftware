/**
 * Módulo de consumo de Servicios Externos desde el Front-End (Browser).
 * Integra TheMealDB API (recetas internacionales y búsqueda por ingredientes)
 * y Open Food Facts API (datos nutricionales y Eco-Score).
 */

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const OPENFOODFACTS_BASE = 'https://world.openfoodfacts.org/api/v2';

/**
 * Normaliza el formato de una receta proveniente de TheMealDB.
 * @param {object} raw
 * @returns {object}
 */
export function normalizeMealDbRecipe(raw) {
  if (!raw) return null;

  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = raw[`strIngredient${i}`];
    const measure = raw[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push({
        name: name.trim(),
        measure: measure ? measure.trim() : '',
      });
    }
  }

  const tags = raw.strTags
    ? raw.strTags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    id: raw.idMeal,
    title: raw.strMeal,
    category: raw.strCategory || 'General',
    area: raw.strArea || 'Internacional',
    instructions: raw.strInstructions || '',
    thumbnail: raw.strMealThumb || '',
    youtubeUrl: raw.strYoutube || '',
    sourceUrl: raw.strSource || '',
    tags,
    ingredients,
  };
}

/**
 * Normaliza productos de Open Food Facts.
 * @param {object} raw
 * @returns {object}
 */
export function normalizeFoodProduct(raw) {
  if (!raw) return null;
  return {
    code: raw.code || '',
    name: raw.product_name || raw.generic_name || 'Alimento',
    brand: raw.brands || 'Genérico',
    nutriscore: (raw.nutriscore_grade || 'n/a').toUpperCase(),
    ecoscore: (raw.ecoscore_grade || 'n/a').toUpperCase(),
    co2Kg: raw.ecoscore_data?.agribalyse?.co2_total
      ? (raw.ecoscore_data.agribalyse.co2_total).toFixed(2)
      : null,
    image: raw.image_front_small_url || raw.image_url || '',
    categories: raw.categories ? raw.categories.split(',').slice(0, 3).map((c) => c.trim()) : [],
  };
}

/**
 * Cliente de servicios externos para el frontend.
 */
export const externalService = {
  /**
   * Busca recetas en TheMealDB por nombre o término.
   * @param {string} query
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array>}
   */
  async searchRecipes(query, signal) {
    const q = String(query ?? '').trim();
    if (!q) return [];

    const url = `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(q)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Error en servicio TheMealDB (${res.status})`);

    const data = await res.json();
    return Array.isArray(data.meals) ? data.meals.map(normalizeMealDbRecipe) : [];
  },

  /**
   * Filtra recetas en TheMealDB por ingrediente principal.
   * @param {string} ingredient
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array>}
   */
  async getRecipesByIngredient(ingredient, signal) {
    const ing = String(ingredient ?? '').trim().toLowerCase().replace(/\s+/g, '_');
    if (!ing) return [];

    const url = `${THEMEALDB_BASE}/filter.php?i=${encodeURIComponent(ing)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Error en servicio TheMealDB (${res.status})`);

    const data = await res.json();
    if (!Array.isArray(data.meals)) return [];

    return data.meals.map((m) => ({
      id: m.idMeal,
      title: m.strMeal,
      thumbnail: m.strMealThumb,
      category: 'Inspiración',
      area: 'Global',
      ingredients: [],
    }));
  },

  /**
   * Obtiene la información completa de una receta de TheMealDB por su ID.
   * @param {string|number} mealId
   * @param {AbortSignal} [signal]
   * @returns {Promise<object>}
   */
  async getRecipeDetails(mealId, signal) {
    if (!mealId) throw new Error('ID de receta requerido');
    const url = `${THEMEALDB_BASE}/lookup.php?i=${encodeURIComponent(mealId)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Error en servicio TheMealDB (${res.status})`);

    const data = await res.json();
    const meal = data.meals?.[0];
    if (!meal) throw new Error('Receta no encontrada en servicio externo');

    return normalizeMealDbRecipe(meal);
  },

  /**
   * Consulta datos de producto y Eco-Score en Open Food Facts.
   * @param {string} term
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array>}
   */
  async searchFoodFacts(term, signal) {
    const t = String(term ?? '').trim();
    if (!t) return [];

    const url = `${OPENFOODFACTS_BASE}/search?search_terms=${encodeURIComponent(t)}&page_size=3`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Error en Open Food Facts (${res.status})`);

    const data = await res.json();
    return Array.isArray(data.products) ? data.products.map(normalizeFoodProduct) : [];
  },
};
