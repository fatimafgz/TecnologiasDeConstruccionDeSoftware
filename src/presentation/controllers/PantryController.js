/** CAPA DE PRESENTACION — Controlador REST de la despensa. */
import { CreatePantryItemDTO, UpdateQuantityDTO } from '../dto/PantryItemDTO.js';
import { sendJson, readJsonBody } from '../http/responses.js';

export class PantryController {
  constructor({ pantryService }) { this.service = pantryService; }

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
    sendJson(res, 201, this.service.addItem(dto));
  }

  /** PATCH /api/pantry/:id */
  async updateQuantity(req, res, { params }) {
    const dto = UpdateQuantityDTO.from(await readJsonBody(req));
    sendJson(res, 200, this.service.updateQuantity(Number(params.id), dto.quantity));
  }

  /** DELETE /api/pantry/:id */
  remove(req, res, { params }) {
    sendJson(res, 200, this.service.removeItem(Number(params.id)));
  }
}
