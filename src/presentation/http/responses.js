/** CAPA DE PRESENTACION — Serializacion y codigos de estado HTTP. */
import { DomainError } from '../../business/errors.js';

export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

export function sendError(res, err) {
  if (err instanceof DomainError) {
    return sendJson(res, err.status, {
      error: err.message, code: err.name, details: err.details ?? undefined,
    });
  }
  console.error('[500]', err);
  return sendJson(res, 500, { error: 'Error interno del servidor', code: 'InternalError' });
}

export async function readJsonBody(req, limitBytes = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new DomainError('Cuerpo demasiado grande', 413);
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new DomainError('JSON malformado', 400);
  }
}
