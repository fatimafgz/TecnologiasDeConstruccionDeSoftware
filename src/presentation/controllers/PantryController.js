/** CAPA DE PRESENTACION — Controlador REST de la despensa. */
import { CreatePantryItemDTO, UpdateQuantityDTO } from '../dto/PantryItemDTO.js';
import { sendJson, readJsonBody } from '../http/responses.js';

export class PantryController {
  constructor({ pantryService, wsServer }) {
    this.service = pantryService;
    this.ws = wsServer;
  }

  /** GET /api/pantry?category=Verduras */
  list(req, res, { query }) {
    const items = this.service.listPantry({ category: query.get('category') });
    sendJson(res, 200, {
      items,
      summary: this.service.getSummary(),
      categories: this.service.listCategories(),
    });
  }

  /** POST /api/pantry */
  async create(req, res) {
    const dto = CreatePantryItemDTO.from(await readJsonBody(req));
    const created = this.service.addItem(dto);
    this.ws?.broadcastPantryUpdate('add', created);
    sendJson(res, 201, created);
  }

  /** PATCH /api/pantry/:id */
  async updateQuantity(req, res, { params }) {
    const dto = UpdateQuantityDTO.from(await readJsonBody(req));
    const updated = this.service.updateQuantity(Number(params.id), dto.quantity);
    this.ws?.broadcastPantryUpdate('update', updated);
    sendJson(res, 200, updated);
  }

  /** DELETE /api/pantry/:id */
  remove(req, res, { params }) {
    const result = this.service.removeItem(Number(params.id));
    this.ws?.broadcastPantryUpdate('remove', { id: Number(params.id) });
    sendJson(res, 200, result);
  }
}
