/** CAPA DE PRESENTACION — Controlador REST del modo "¡Cocinada!". */
import { CookDTO } from '../dto/CookDTO.js';
import { sendJson, readJsonBody } from '../http/responses.js';

export class CookingController {
  constructor({ cookingExecutionService, wsServer }) {
    this.service = cookingExecutionService;
    this.ws = wsServer;
  }

  /** POST /api/cook */
  async cook(req, res) {
    const dto = CookDTO.from(await readJsonBody(req));
    const result = this.service.cook(dto);
    this.ws?.broadcastCookEvent({
      recipeTitle: result.recipeTitle,
      servings: result.log?.servings ?? dto.servings,
      savedItems: result.log?.savedItems ?? 0,
    });
    sendJson(res, 201, result);
  }

  /** GET /api/cook/history */
  history(req, res) {
    sendJson(res, 200, { logs: this.service.history(10) });
  }
}
