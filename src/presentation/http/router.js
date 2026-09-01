/** CAPA DE PRESENTACION — Router minimo con patrones '/api/pantry/:id'. */
import { sendError, sendJson } from './responses.js';

export class Router {
  constructor() { this.routes = []; }

  add(method, pattern, handler) {
    const keys = [];
    const regex = new RegExp('^' + pattern
      .replace(/\/:([A-Za-z_]+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; }) + '$');
    this.routes.push({ method, regex, keys, handler });
    return this;
  }
  get(p, h) { return this.add('GET', p, h); }
  post(p, h) { return this.add('POST', p, h); }
  patch(p, h) { return this.add('PATCH', p, h); }
  delete(p, h) { return this.add('DELETE', p, h); }

  match(method, pathname) {
    for (const route of this.routes) {
      const m = route.regex.exec(pathname);
      if (m && route.method === method) {
        const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
        return { route, params };
      }
    }
    return null;
  }

  async handle(req, res, url) {
    const found = this.match(req.method, url.pathname);
    if (!found) return sendJson(res, 404, { error: 'Recurso no encontrado', code: 'NotFound' });
    try {
      await found.route.handler(req, res, { params: found.params, query: url.searchParams });
    } catch (err) {
      sendError(res, err);
    }
  }
}
