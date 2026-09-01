/**
 * BOOTSTRAP — arranque HTTP de ZeroWaste Pantry.
 * Cablea controladores (presentacion) contra los servicios del contenedor.
 */
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildContainer } from './src/composition.js';
import { Router } from './src/presentation/http/router.js';
import { createStaticHandler } from './src/presentation/http/staticFiles.js';
import { sendError } from './src/presentation/http/responses.js';
import { PantryController } from './src/presentation/controllers/PantryController.js';
import { RecipeController } from './src/presentation/controllers/RecipeController.js';
import { CookingController } from './src/presentation/controllers/CookingController.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);

const { services } = buildContainer();

const pantryController = new PantryController(services);
const recipeController = new RecipeController(services);
const cookingController = new CookingController(services);

const router = new Router()
  .get('/api/pantry', (...a) => pantryController.list(...a))
  .post('/api/pantry', (...a) => pantryController.create(...a))
  .patch('/api/pantry/:id', (...a) => pantryController.updateQuantity(...a))
  .delete('/api/pantry/:id', (...a) => pantryController.remove(...a))
  .get('/api/recipes', (...a) => recipeController.recommend(...a))
  .get('/api/recipes/:id', (...a) => recipeController.detail(...a))
  .post('/api/cook', (...a) => cookingController.cook(...a))
  .get('/api/cook/history', (...a) => cookingController.history(...a));

const serveStatic = createStaticHandler(join(__dirname, 'src', 'presentation', 'public'));

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    if (url.pathname.startsWith('/api/')) return router.handle(req, res, url);
    if (await serveStatic(req, res, url.pathname)) return;
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  } catch (err) {
    sendError(res, err);
  }
});

server.listen(PORT, () => {
  console.log(`\n  🥬  ZeroWaste Pantry escuchando en http://localhost:${PORT}\n`);
});
