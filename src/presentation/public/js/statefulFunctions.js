/**
 * UI / PRESENTACIÓN — Funciones Stateful (Con Estado / Con Memoria).
 */

/**
 * FUNCIÓN STATEFUL 1: createFavoritesTracker
 * Mantiene en memoria de sesión el conjunto de IDs de recetas favoritas.
 */
export function createFavoritesTracker(initialFavorites = []) {
  const favoritesSet = new Set(
    (Array.isArray(initialFavorites) ? initialFavorites : []).map(Number).filter(Boolean)
  );

  return {
    toggle(id) {
      const numId = Number(id);
      if (!numId) return false;
      if (favoritesSet.has(numId)) {
        favoritesSet.delete(numId);
        return false;
      } else {
        favoritesSet.add(numId);
        return true;
      }
    },

    add(id) {
      const numId = Number(id);
      if (!numId || favoritesSet.has(numId)) return false;
      favoritesSet.add(numId);
      return true;
    },

    remove(id) {
      const numId = Number(id);
      return favoritesSet.delete(numId);
    },

    isFavorite(id) {
      return favoritesSet.has(Number(id));
    },

    getAll() {
      return [...favoritesSet];
    },

    count() {
      return favoritesSet.size;
    },

    clear() {
      favoritesSet.clear();
    },
  };
}

/**
 * FUNCIÓN STATEFUL 2: createWasteSavingsTracker
 * Acumulador de sesión con estado para métricas de cocina y racha.
 */
export function createWasteSavingsTracker() {
  let totalCooked = 0;
  let totalSavedItems = 0;
  let totalCo2Avoided = 0;
  let totalWaterSaved = 0;
  let totalMoneySaved = 0;
  let streak = 0;
  const history = [];

  return {
    recordCook(event = {}) {
      const savedItems = Math.max(0, Number(event.savedItems) || 0);
      const servings = Math.max(1, Number(event.servings) || 1);
      const co2 = Math.max(0, Number(event.co2AvoidedKg) || 0);
      const water = Math.max(0, Number(event.waterSavedLiters) || 0);
      const money = Math.max(0, Number(event.moneySavedEur) || 0);

      totalCooked += 1;
      totalSavedItems += savedItems;
      totalCo2Avoided += co2;
      totalWaterSaved += water;
      totalMoneySaved += money;

      if (savedItems > 0) {
        streak += 1;
      } else {
        streak = 0;
      }

      const logEntry = {
        id: totalCooked,
        timestamp: new Date().toISOString(),
        recipeTitle: event.recipeTitle || 'Receta sin título',
        servings,
        savedItems,
        co2AvoidedKg: Math.round(co2 * 100) / 100,
        waterSavedLiters: Math.round(water),
        moneySavedEur: Math.round(money * 100) / 100,
      };

      history.push(logEntry);

      return {
        recorded: logEntry,
        currentSummary: this.getSummary(),
      };
    },

    getSummary() {
      return {
        totalCooked,
        totalSavedItems,
        totalCo2AvoidedKg: Math.round(totalCo2Avoided * 100) / 100,
        totalWaterSavedLiters: Math.round(totalWaterSaved),
        totalMoneySavedEur: Math.round(totalMoneySaved * 100) / 100,
        streak,
      };
    },

    getHistory() {
      return [...history];
    },

    getStreak() {
      return streak;
    },

    reset() {
      totalCooked = 0;
      totalSavedItems = 0;
      totalCo2Avoided = 0;
      totalWaterSaved = 0;
      totalMoneySaved = 0;
      streak = 0;
      history.length = 0;
    },
  };
}
