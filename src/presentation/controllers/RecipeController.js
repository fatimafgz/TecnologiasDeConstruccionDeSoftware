/** CAPA DE PRESENTACION — Controlador REST de recetas y recomendaciones. */
import { sendJson } from '../http/responses.js';
import { ValidationError } from '../../business/errors.js';

export class RecipeController {
  constructor({ recipeMatchingService }) { this.service = recipeMatchingService; }

  /** GET /api/recipes?servings=4 */
  recommend(req, res, { query }) {
    const servings = query.has('servings') ? Number(query.get('servings')) : null;
    if (servings !== null && (!Number.isFinite(servings) || servings <= 0)) {
      throw new ValidationError('Parametro servings invalido');
    }
    sendJson(res, 200, { recipes: this.service.recommend({ servings }) });
  }

  /** GET /api/recipes/:id?servings=4 */
  detail(req, res, { params, query }) {
    const servings = query.has('servings') ? Number(query.get('servings')) : null;
    sendJson(res, 200, this.service.detail(Number(params.id), servings));
  }
}
