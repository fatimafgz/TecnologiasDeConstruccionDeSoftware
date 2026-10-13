/**
 * CAPA DE LÓGICA DE NEGOCIO — Funciones Stateful (Con Estado / Con Memoria).
 *
 * DEFINICIÓN TEÓRICA DE FUNCIÓN STATEFUL:
 * Una función es stateful (con estado) cuando su comportamiento, valor devuelto
 * o efecto dependen de un ESTADO INTERNO PERSISTENTE que se mantiene y muta
 * a lo largo de sucesivas invocaciones.
 * Dos llamadas idénticas con los mismos parámetros pueden producir respuestas
 * distintas si el estado interno cambió entre medias.
 */

/**
 * =========================================================================
 * FUNCIÓN STATEFUL 1: createFavoritesTracker
 * =========================================================================
 * Fábrica de función/gestor con estado basada en clausura (closure).
 * Mantiene en memoria el conjunto mutable de recetas favoritas del usuario.
 *
 * PROPIEDADES STATEFUL:
 * - Mantiene un estado interno encapsulado (`favoritesSet`) que perdura entre llamadas.
 * - Mutación de estado: Las llamadas a `toggle()`, `add()` y `remove()` alteran el estado.
 * - Dependencia histórica: `isFavorite(id)` devuelve true o false dependiendo de las
 *   operaciones previas.
 *
 * @param {Array<number|string>} [initialFavorites=[]] - Lista inicial de IDs
 * @returns {{
 *   toggle: (id: number|string) => boolean,
 *   add: (id: number|string) => boolean,
 *   remove: (id: number|string) => boolean,
 *   isFavorite: (id: number|string) => boolean,
 *   getAll: () => number[],
 *   count: () => number,
 *   clear: () => void
 * }}
 */
export function createFavoritesTracker(initialFavorites = []) {
  // Estado interno encapsulado en el ámbito léxico de la clausura
  const favoritesSet = new Set(
    (Array.isArray(initialFavorites) ? initialFavorites : []).map(Number).filter(Boolean)
  );

  return {
    /**
     * Conmuta el estado de favorito: si existe lo quita, si no existe lo agrega.
     * Muta el estado interno.
     * @param {number|string} id
     * @returns {boolean} true si ahora es favorito, false si fue removido
     */
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

    /**
     * Agrega un ID al estado interno.
     * @param {number|string} id
     * @returns {boolean} true si se agregó, false si ya estaba presente
     */
    add(id) {
      const numId = Number(id);
      if (!numId || favoritesSet.has(numId)) return false;
      favoritesSet.add(numId);
      return true;
    },

    /**
     * Elimina un ID del estado interno.
     * @param {number|string} id
     * @returns {boolean} true si se eliminó, false si no existía
     */
    remove(id) {
      const numId = Number(id);
      return favoritesSet.delete(numId);
    },

    /**
     * Consulta si un ID específico está en el estado actual.
     * @param {number|string} id
     * @returns {boolean}
     */
    isFavorite(id) {
      return favoritesSet.has(Number(id));
    },

    /**
     * Obtiene una instantánea inmutable del estado actual de IDs favoritos.
     * @returns {number[]}
     */
    getAll() {
      return [...favoritesSet];
    },

    /**
     * Retorna la cantidad de elementos en el estado actual.
     * @returns {number}
     */
    count() {
      return favoritesSet.size;
    },

    /**
     * Reinicia el estado interno a vacío.
     */
    clear() {
      favoritesSet.clear();
    },
  };
}

/**
 * =========================================================================
 * FUNCIÓN STATEFUL 2: createWasteSavingsTracker
 * =========================================================================
 * Fábrica de función/acumulador con estado para la sesión de cocina.
 * Mantiene métricas acumulativas (recetas cocinadas, lotes rescatados, CO2 evitado,
 * agua ahorrada, racha activa e historial de sesión).
 *
 * PROPIEDADES STATEFUL:
 * - Acumulación temporal: Cada llamada a `recordCook()` modifica las variables internas
 *   acumulando el impacto a lo largo del tiempo.
 * - Las consultas a `getSummary()` reflejan la evolución acumulativa del estado.
 *
 * @returns {{
 *   recordCook: (event: {
 *     recipeTitle: string,
 *     servings: number,
 *     savedItems?: number,
 *     co2AvoidedKg?: number,
 *     waterSavedLiters?: number,
 *     moneySavedEur?: number
 *   }) => object,
 *   getSummary: () => {
 *     totalCooked: number,
 *     totalSavedItems: number,
 *     totalCo2AvoidedKg: number,
 *     totalWaterSavedLiters: number,
 *     totalMoneySavedEur: number,
 *     streak: number
 *   },
 *   getHistory: () => Array<object>,
 *   getStreak: () => number,
 *   reset: () => void
 * }}
 */
export function createWasteSavingsTracker() {
  // Variables de estado interno de la sesión
  let totalCooked = 0;
  let totalSavedItems = 0;
  let totalCo2Avoided = 0;
  let totalWaterSaved = 0;
  let totalMoneySaved = 0;
  let streak = 0;
  const history = [];

  return {
    /**
     * Registra un evento de cocina y muta todos los acumuladores internos de estado.
     * @param {object} event
     * @returns {object} resumen actualizado del estado
     */
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

      // Incrementa la racha si se rescataron ingredientes en riesgo
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

    /**
     * Devuelve una instantánea del estado acumulado actual.
     */
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

    /**
     * Devuelve una copia del historial de eventos de la sesión.
     */
    getHistory() {
      return [...history];
    },

    /**
     * Devuelve la racha actual de recetas cocinadas con rescate.
     */
    getStreak() {
      return streak;
    },

    /**
     * Restablece todo el estado interno a sus valores iniciales.
     */
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
