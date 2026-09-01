/** CAPA DE PRESENTACION — Servidor de assets estaticos de la UI. */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

export function createStaticHandler(root) {
  return async function serve(req, res, pathname) {
    const rel = normalize(pathname === '/' ? '/index.html' : pathname).replace(/^[/\\]+/, '');
    if (rel.includes('..')) { res.writeHead(403).end('Forbidden'); return true; }
    const file = join(root, rel);
    try {
      const info = await stat(file);
      if (!info.isFile()) return false;
      res.writeHead(200, {
        'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
        'Content-Length': info.size,
      });
      createReadStream(file).pipe(res);
      return true;
    } catch {
      return false;
    }
  };
}
