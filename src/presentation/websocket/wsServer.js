/**
 * Servidor WebSocket nativo (RFC 6455) para ZeroWaste Pantry.
 * Implementado sin dependencias externas usando node:crypto y node:http.
 *
 * Características en tiempo real:
 *  - Sincronización colaborativa de despensa (PANTRY_UPDATED).
 *  - Notificación de recetas cocinadas y rescate de alimentos (COOKED_RECIPE).
 *  - Conteo de usuarios/cocineros conectados en vivo (CLIENTS_COUNT).
 *  - Difusión de alertas de caducidad urgente (WASTE_ALERT).
 */
import { createHash } from 'node:crypto';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/**
 * Codifica un mensaje de texto del servidor al cliente (Frame no enmascarado).
 * @param {string} text
 * @returns {Buffer}
 */
export function encodeServerFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  let header;
  if (payload.length <= 125) {
    header = Buffer.from([0x81, payload.length]);
  } else if (payload.length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
  }
  return Buffer.concat([header, payload]);
}

/**
 * Decodifica un frame recibido del cliente (Frame enmascarado según RFC 6455).
 * @param {Buffer} buffer
 * @returns {{ opcode: number, text?: string, isClose: boolean, isPing: boolean } | null}
 */
export function decodeClientFrame(buffer) {
  if (!buffer || buffer.length < 2) return null;

  const firstByte = buffer[0];
  const secondByte = buffer[1];
  const opcode = firstByte & 0x0f;
  const isMasked = (secondByte & 0x80) === 0x80;

  if (opcode === 0x08) {
    return { opcode, isClose: true, isPing: false };
  }
  if (opcode === 0x09) {
    return { opcode, isClose: false, isPing: true };
  }

  let payloadLength = secondByte & 0x7f;
  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    payloadLength = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  if (isMasked) {
    if (buffer.length < offset + 4 + payloadLength) return null;
    const maskKey = buffer.subarray(offset, offset + 4);
    offset += 4;
    const unmasked = Buffer.alloc(payloadLength);
    for (let i = 0; i < payloadLength; i++) {
      unmasked[i] = buffer[offset + i] ^ maskKey[i % 4];
    }
    return { opcode, text: unmasked.toString('utf8'), isClose: false, isPing: false };
  }

  if (buffer.length < offset + payloadLength) return null;
  const unmasked = buffer.subarray(offset, offset + payloadLength);
  return { opcode, text: unmasked.toString('utf8'), isClose: false, isPing: false };
}

/**
 * Calcula el encabezado Sec-WebSocket-Accept.
 * @param {string} secWebSocketKey
 * @returns {string}
 */
export function calculateAcceptKey(secWebSocketKey) {
  return createHash('sha1')
    .update(secWebSocketKey + WS_GUID)
    .digest('base64');
}

/**
 * Crea e inicializa el gestor WebSocket sobre un servidor HTTP existente.
 * @param {import('node:http').Server} httpServer
 * @param {{ path?: string }} [options]
 */
export function createWebSocketServer(httpServer, { path = '/ws' } = {}) {
  const clients = new Set();

  function broadcast(data) {
    const payloadStr = typeof data === 'string' ? data : JSON.stringify(data);
    const frame = encodeServerFrame(payloadStr);

    for (const socket of clients) {
      if (socket.writable) {
        try {
          socket.write(frame);
        } catch {
          clients.delete(socket);
        }
      } else {
        clients.delete(socket);
      }
    }
  }

  function broadcastClientsCount() {
    broadcast({
      type: 'CLIENTS_COUNT',
      count: clients.size,
      timestamp: new Date().toISOString(),
    });
  }

  httpServer.on('upgrade', (req, socket, head) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
      if (url.pathname !== path) {
        socket.destroy();
        return;
      }

      const key = req.headers['sec-websocket-key'];
      if (!key) {
        socket.destroy();
        return;
      }

      const acceptKey = calculateAcceptKey(key);
      const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '\r\n',
      ].join('\r\n');

      socket.write(responseHeaders);
      clients.add(socket);

      // Notificar al nuevo cliente de bienvenida y conteo global
      const welcomeFrame = encodeServerFrame(JSON.stringify({
        type: 'CONNECTED',
        message: 'Conectado al canal en tiempo real de ZeroWaste Pantry',
        clientsOnline: clients.size,
        timestamp: new Date().toISOString(),
      }));
      socket.write(welcomeFrame);
      broadcastClientsCount();

      // Buffer para ensamblar paquetes TCP
      let buffer = Buffer.alloc(0);

      socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        while (buffer.length >= 2) {
          const frame = decodeClientFrame(buffer);
          if (!frame) break;

          if (frame.isClose) {
            socket.end();
            clients.delete(socket);
            broadcastClientsCount();
            return;
          }

          if (frame.isPing) {
            // Responder Pong (0x8A)
            socket.write(Buffer.from([0x8a, 0x00]));
          } else if (frame.text) {
            try {
              const msg = JSON.parse(frame.text);
              handleClientMessage(msg, socket);
            } catch (err) {
              console.warn('[WebSocket] Error al procesar mensaje JSON del cliente:', err.message);
            }
          }

          // Descartar bytes procesados (asumiendo frame simple)
          buffer = Buffer.alloc(0);
        }
      });

      socket.on('close', () => {
        clients.delete(socket);
        broadcastClientsCount();
      });

      socket.on('error', () => {
        clients.delete(socket);
        broadcastClientsCount();
      });
    } catch (err) {
      console.error('[WebSocket] Error en handshake:', err);
      socket.destroy();
    }
  });

  function handleClientMessage(msg, socket) {
    if (msg.type === 'PING') {
      socket.write(encodeServerFrame(JSON.stringify({ type: 'PONG', timestamp: Date.now() })));
      return;
    }

    if (msg.type === 'BROADCAST_ALERT') {
      // Re-transmitir alerta a todos los demás clientes
      broadcast({
        type: 'WASTE_ALERT',
        title: msg.title || 'Alerta de cocina',
        message: msg.message || 'Se ha emitido una alerta en la despensa.',
        user: msg.user || 'Cocinero',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return {
    broadcast,
    broadcastPantryUpdate(action, item) {
      broadcast({
        type: 'PANTRY_UPDATED',
        action, // 'add' | 'update' | 'remove'
        item,
        timestamp: new Date().toISOString(),
      });
    },
    broadcastCookEvent({ recipeTitle, servings, savedItems }) {
      broadcast({
        type: 'COOKED_RECIPE',
        recipeTitle,
        servings,
        savedItems,
        timestamp: new Date().toISOString(),
      });
    },
    getClientsCount() {
      return clients.size;
    },
  };
}
