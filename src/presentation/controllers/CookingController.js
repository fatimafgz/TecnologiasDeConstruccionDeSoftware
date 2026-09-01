/** CAPA DE PRESENTACION — Controlador REST del modo "¡Cocinada!". */
import { CookDTO } from '../dto/CookDTO.js';
import { sendJson, readJsonBody } from '../http/responses.js';

export class CookingController {
  constructor({ cookingExecutionService }) { this.service = cookingExecutionService; }

  /** POST /api/cook */
  async cook(req, res) {
    const dto = CookDTO.from(await readJsonBody(req));
    sendJson(res, 201, this.service.cook(dto));
  }

  /** GET /api/cook/history */
  history(req, res) {
    sendJson(res, 200, { logs: this.service.history(10) });
  }
}
