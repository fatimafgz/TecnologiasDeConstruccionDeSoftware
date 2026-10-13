/**
 * CAPA DE LOGICA DE NEGOCIO — RecipeMatchingService.
 * Algoritmo de puntuacion ZeroWaste:
 *
 *   Score = Σ ( peso_del_ingrediente_en_la_receta × urgencia_de_caducidad )
 *
 * Solo suman los ingredientes que la receta usa Y estan en la despensa.
 * El desempate favorece la mayor cobertura y el menor tiempo de preparacion.
 */
import { URGENCY_UI, UrgencyLevel } from '../domain/Urgency.js';
import { calculateEcoImpact } from '../domain/statelessFunctions.js';
import { NotFoundError } from './errors.js';

export class RecipeMatchingService {
  constructor({ recipeRepository, pantryRepository, portionScalingService, clock = () => new Date() }) {
    this.recipes = recipeRepository;
    this.pantry = pantryRepository;
    this.scaling = portionScalingService;
    this.clock = clock;
  }

  /** Recetas recomendadas, ordenadas por Score de Aprovechamiento ZeroWaste. */
  recommend({ servings = null, limit = 50 } = {}) {
    const now = this.clock();
    const stock = this.#stockIndex(now);
    return this.recipes.findAll()
      .map((recipe) => this.#evaluate(recipe, stock, servings ?? recipe.baseServings, now))
      .sort((a, b) =>
        b.score - a.score ||
        b.atRiskCount - a.atRiskCount ||
        b.coverage - a.coverage ||
        a.minutes - b.minutes)
      .slice(0, limit);
  }

  /** Detalle de una receta ya escalada y contrastada con la despensa. */
  detail(recipeId, servings = null) {
    const recipe = this.recipes.findById(recipeId);
    if (!recipe) throw new NotFoundError(`Receta ${recipeId} no encontrada`);
    const now = this.clock();
    const evaluated = this.#evaluate(recipe, this.#stockIndex(now), servings ?? recipe.baseServings, now);
    return { ...evaluated, description: recipe.description, steps: recipe.steps };
  }

  /**
   * Indice de disponibilidad por ingrediente: cantidad total y la urgencia
   * MAXIMA entre sus lotes (el lote mas critico manda en el score).
   */
  #stockIndex(now) {
    const index = new Map();
    for (const item of this.pantry.findAll()) {
      const prev = index.get(item.ingredientId) ?? {
        quantity: 0, unit: item.unit, urgencyWeight: 0,
        urgency: UrgencyLevel.FRESH, daysLeft: Infinity, atRisk: false,
      };
      const w = item.urgencyWeight(now);
      index.set(item.ingredientId, {
        quantity: prev.quantity + item.quantity,
        unit: item.unit,
        urgencyWeight: Math.max(prev.urgencyWeight, w),
        urgency: w >= prev.urgencyWeight ? item.urgency(now) : prev.urgency,
        daysLeft: Math.min(prev.daysLeft, item.daysLeft(now)),
        atRisk: prev.atRisk || item.isAtRisk(now),
      });
    }
    return index;
  }

  #evaluate(recipe, stock, servings, now) {
    const lines = this.scaling.scaleIngredients(recipe, servings);

    let score = 0;
    let atRiskCount = 0;
    let availableRequired = 0;
    let totalRequired = 0;
    const missing = [];

    const ingredients = lines.map((line) => {
      const have = stock.get(line.ingredientId);
      const enough = Boolean(have) && have.quantity >= line.quantity;
      if (!line.optional) {
        totalRequired += 1;
        if (enough) availableRequired += 1;
        else missing.push({ name: line.name, needed: line.quantity, unit: line.unit,
                            available: have?.quantity ?? 0 });
      }
      if (have) {
        // Nucleo del algoritmo: peso en la receta x urgencia del ingrediente.
        score += line.weight * have.urgencyWeight;
        if (have.atRisk) atRiskCount += 1;
      }
      return {
        ...line,
        inPantry: Boolean(have),
        available: have?.quantity ?? 0,
        enough,
        urgency: have?.urgency ?? null,
        daysLeft: have ? have.daysLeft : null,
        badge: have ? URGENCY_UI[have.urgency] : null,
      };
    });

    const coverage = totalRequired === 0 ? 1 : availableRequired / totalRequired;

    return {
      id: recipe.id,
      title: recipe.title,
      minutes: recipe.minutes,
      baseServings: recipe.baseServings,
      servings,
      score: Math.round(score * 100) / 100,
      coverage: Math.round(coverage * 100) / 100,
      coveragePct: Math.round(coverage * 100),
      atRiskCount,
      cookable: missing.length === 0,
      missing,
      ingredients,
      ecoImpact: calculateEcoImpact(lines),
      highlight: atRiskCount > 0
        ? `Usa ${atRiskCount} ingrediente${atRiskCount > 1 ? 's' : ''} a punto de vencer`
        : 'Sin ingredientes en riesgo',
    };
  }
}
