/**
 * UI / PRESENTACIÓN — Funciones Stateless (Puras / Sin Estado).
 */

const ECO_COEFFICIENTS = Object.freeze({
  'Verduras':      { co2PerKg: 1.5,  waterLitersPerKg: 300,  eurPerKg: 2.8 },
  'Lacteos':       { co2PerKg: 4.2,  waterLitersPerKg: 1000, eurPerKg: 4.5 },
  'Carnes':        { co2PerKg: 14.0, waterLitersPerKg: 4000, eurPerKg: 11.0 },
  'Despensa seca': { co2PerKg: 2.0,  waterLitersPerKg: 800,  eurPerKg: 3.2 },
  'Otros':         { co2PerKg: 2.5,  waterLitersPerKg: 600,  eurPerKg: 3.5 },
});

function normalizeToKg(quantity, unit) {
  const q = Math.max(0, Number(quantity) || 0);
  switch (unit) {
    case 'g':
    case 'ml':
      return q / 1000;
    case 'pza':
      return (q * 120) / 1000;
    default:
      return q / 1000;
  }
}

/**
 * FUNCIÓN STATELESS 1: calculateEcoImpact
 * Calcula de manera pura el impacto ambiental y ahorro monetario estimado.
 */
export function calculateEcoImpact(items = []) {
  if (!Array.isArray(items)) {
    return {
      co2AvoidedKg: 0,
      waterSavedLiters: 0,
      moneySavedEur: 0,
      totalWeightGrams: 0,
      formatted: { co2: '0.00 kg CO₂', water: '0 L agua', money: '0.00 €' },
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
 * FUNCIÓN STATELESS 2: calculateShoppingListDiff
 * Compara funcionalmente requerimientos vs inventario y devuelve faltantes/cubiertos.
 */
export function calculateShoppingListDiff(requiredIngredients = [], pantryStock = []) {
  const reqList = Array.isArray(requiredIngredients) ? requiredIngredients : [];
  const stockList = Array.isArray(pantryStock) ? pantryStock : [];

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
