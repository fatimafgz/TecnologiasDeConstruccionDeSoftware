/**
 * CAPA DE DOMINIO — Funciones Stateless (Puras / Sin Estado).
 *
 * DEFINICIÓN TEÓRICA DE FUNCIÓN STATELESS:
 * Una función es stateless (sin estado) cuando su valor de retorno depende
 * ÚNICA Y EXCLUSIVAMENTE de los argumentos pasados como entrada.
 * No lee ni modifica ningún estado externo (variables globales, bases de datos,
 * almacenamiento local, timers) ni muta los objetos recibidos como parámetros.
 * Es determinista, idempotente y carece de efectos secundarios (side effects).
 */

/**
 * Coeficientes ecológicos promedio por categoría de alimento (por kg):
 * - kg CO2 emitidos por kg producido
 * - Litros de agua utilizados por kg producido
 * - Coste estimado en EUR por kg
 */
const ECO_COEFFICIENTS = Object.freeze({
  'Verduras':      { co2PerKg: 1.5,  waterLitersPerKg: 300,  eurPerKg: 2.8 },
  'Lacteos':       { co2PerKg: 4.2,  waterLitersPerKg: 1000, eurPerKg: 4.5 },
  'Carnes':        { co2PerKg: 14.0, waterLitersPerKg: 4000, eurPerKg: 11.0 },
  'Despensa seca': { co2PerKg: 2.0,  waterLitersPerKg: 800,  eurPerKg: 3.2 },
  'Otros':         { co2PerKg: 2.5,  waterLitersPerKg: 600,  eurPerKg: 3.5 },
});

/**
 * Normaliza cualquier unidad ('g', 'ml', 'pza') a su peso equivalente en kilogramos.
 * Función pura auxiliar.
 * @param {number} quantity
 * @param {string} unit
 * @returns {number} peso en kg
 */
function normalizeToKg(quantity, unit) {
  const q = Math.max(0, Number(quantity) || 0);
  switch (unit) {
    case 'g':
    case 'ml':
      return q / 1000;
    case 'pza':
      // Promedio estimado de 1 unidad estándar (ej. 1 huevo, 1 manzana ~ 120 g)
      return (q * 120) / 1000;
    default:
      return q / 1000;
  }
}

/**
 * =========================================================================
 * FUNCIÓN STATELESS 1: calculateEcoImpact
 * =========================================================================
 * Calcula el impacto ambiental y ahorro económico estimado al rescatar o consumir
 * una lista de ingredientes dados.
 *
 * PROPIEDADES STATELESS:
 * - Determinista: Con la misma entrada siempre devuelve exactamente el mismo resultado.
 * - Sin efectos secundarios: No modifica el arreglo de entrada ni variables externas.
 * - Sin memoria: No retiene ninguna información entre llamadas sucesivas.
 *
 * @param {Array<{ ingredientName?: string, name?: string, category?: string, quantity: number, unit: string }>} items
 * @returns {{
 *   co2AvoidedKg: number,
 *   waterSavedLiters: number,
 *   moneySavedEur: number,
 *   totalWeightGrams: number,
 *   formatted: { co2: string, water: string, money: string }
 * }}
 */
export function calculateEcoImpact(items = []) {
  if (!Array.isArray(items)) {
    return {
      co2AvoidedKg: 0,
      waterSavedLiters: 0,
      moneySavedEur: 0,
      totalWeightGrams: 0,
      formatted: { co2: '0.00 kg', water: '0 L', money: '0.00 €' },
    };
  }

  let totalKg = 0;
  let totalCo2 = 0;
  let totalWater = 0;
  let totalEur = 0;

  for (const item of items) {
    if (!item) continue;
    const kg = normalizeToKg(item.quantity, item.unit);
    const category = item.category || 'Otros';
    const coeffs = ECO_COEFFICIENTS[category] || ECO_COEFFICIENTS['Otros'];

    totalKg += kg;
    totalCo2 += kg * coeffs.co2PerKg;
    totalWater += kg * coeffs.waterLitersPerKg;
    totalEur += kg * coeffs.eurPerKg;
  }

  const co2AvoidedKg = Math.round(totalCo2 * 100) / 100;
  const waterSavedLiters = Math.round(totalWater);
  const moneySavedEur = Math.round(totalEur * 100) / 100;
  const totalWeightGrams = Math.round(totalKg * 1000);

  return {
    co2AvoidedKg,
    waterSavedLiters,
    moneySavedEur,
    totalWeightGrams,
    formatted: {
      co2: `${co2AvoidedKg.toFixed(2)} kg CO₂`,
      water: `${waterSavedLiters} L agua`,
      money: `${moneySavedEur.toFixed(2)} €`,
    },
  };
}

/**
 * =========================================================================
 * FUNCIÓN STATELESS 2: calculateShoppingListDiff
 * =========================================================================
 * Compara los ingredientes requeridos por una receta contra el stock actual
 * de la despensa y determina qué ingredientes faltan por comprar, cuáles están
 * cubiertos y el porcentaje de cobertura total.
 *
 * PROPIEDADES STATELESS:
 * - Determinista y pura: Opera exclusivamente sobre los dos arreglos suministrados.
 * - Inmutable: No modifica ni `requiredIngredients` ni `pantryStock`.
 * - No consulta base de datos ni altera ninguna colección en memoria.
 *
 * @param {Array<{ ingredientId?: number, name: string, quantity: number, unit: string, optional?: boolean }>} requiredIngredients
 * @param {Array<{ ingredientId?: number, name: string, quantity: number, unit: string }>} pantryStock
 * @returns {{
 *   missing: Array<{ name: string, needed: number, available: number, shortBy: number, unit: string }>,
 *   covered: Array<{ name: string, needed: number, available: number, unit: string }>,
 *   canCook: boolean,
 *   coveragePercentage: number
 * }}
 */
export function calculateShoppingListDiff(requiredIngredients = [], pantryStock = []) {
  const reqList = Array.isArray(requiredIngredients) ? requiredIngredients : [];
  const stockList = Array.isArray(pantryStock) ? pantryStock : [];

  // Mapeo puro en memoria del stock disponible indexado por nombre normalizado o ID
  const stockMap = new Map();
  for (const item of stockList) {
    if (!item) continue;
    const key = item.ingredientId ?? (item.name ? item.name.toLowerCase().trim() : '');
    const prev = stockMap.get(key) || 0;
    stockMap.set(key, prev + (Number(item.quantity) || 0));
  }

  const missing = [];
  const covered = [];
  let totalRequiredCount = 0;
  let coveredCount = 0;

  for (const line of reqList) {
    if (!line) continue;
    const isOptional = Boolean(line.optional);
    const needed = Math.max(0, Number(line.quantity) || 0);
    const key = line.ingredientId ?? (line.name ? line.name.toLowerCase().trim() : '');
    const available = stockMap.get(key) || 0;

    if (!isOptional) {
      totalRequiredCount += 1;
    }

    if (available >= needed) {
      covered.push({
        name: line.name || line.ingredientName || 'Ingrediente',
        needed,
        available,
        unit: line.unit || 'g',
      });
      if (!isOptional) coveredCount += 1;
    } else {
      const shortBy = Math.round((needed - available) * 100) / 100;
      missing.push({
        name: line.name || line.ingredientName || 'Ingrediente',
        needed,
        available,
        shortBy,
        unit: line.unit || 'g',
        optional: isOptional,
      });
    }
  }

  const coveragePercentage = totalRequiredCount === 0
    ? 100
    : Math.round((coveredCount / totalRequiredCount) * 100);

  const canCook = missing.filter((m) => !m.optional).length === 0;

  return {
    missing,
    covered,
    canCook,
    coveragePercentage,
  };
}
