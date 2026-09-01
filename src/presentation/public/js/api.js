/** UI — Cliente HTTP: unica puerta de la vista hacia la API REST. */

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error ?? `Error ${res.status}`);
    err.details = data.details;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  getPantry: (category) =>
    request('/api/pantry' + (category && category !== 'Todas'
      ? `?category=${encodeURIComponent(category)}` : '')),

  addItem: (item) => request('/api/pantry', { method: 'POST', body: JSON.stringify(item) }),

  removeItem: (id) => request(`/api/pantry/${id}`, { method: 'DELETE' }),

  getRecipes: (servings) => request(`/api/recipes?servings=${servings}`),

  getRecipe: (id, servings) => request(`/api/recipes/${id}?servings=${servings}`),

  cook: (recipeId, servings) =>
    request('/api/cook', { method: 'POST', body: JSON.stringify({ recipeId, servings }) }),

  history: () => request('/api/cook/history'),
};
