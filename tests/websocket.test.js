import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  calculateAcceptKey,
  encodeServerFrame,
  decodeClientFrame,
  createWebSocketServer,
} from '../src/presentation/websocket/wsServer.js';

test('WebSocket: calculateAcceptKey cumple con el vector oficial RFC 6455', () => {
  // Vector de prueba oficial especificado en RFC 6455 Sección 4.2.2
  const sampleKey = 'dGhlIHNhbXBsZSBub25jZQ==';
  const expectedAccept = 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=';

  const result = calculateAcceptKey(sampleKey);
  assert.equal(result, expectedAccept, 'El cálculo SHA-1 Base64 debe coincidir exactamente con el RFC 6455');
});

test('WebSocket: encodeServerFrame codifica payloads pequeños y medianos correctamente', () => {
  // 1. Mensaje corto (<= 125 bytes)
  const shortMsg = 'Hola WebSocket';
  const shortFrame = encodeServerFrame(shortMsg);
  assert.equal(shortFrame[0], 0x81); // FIN=1, Opcode=1 (Text)
  assert.equal(shortFrame[1], Buffer.byteLength(shortMsg));
  assert.equal(shortFrame.subarray(2).toString('utf8'), shortMsg);

  // 2. Mensaje mediano (> 125 bytes, formato uint16)
  const mediumMsg = 'A'.repeat(300);
  const mediumFrame = encodeServerFrame(mediumMsg);
  assert.equal(mediumFrame[0], 0x81);
  assert.equal(mediumFrame[1], 126); // Indicador de 2 bytes de longitud
  assert.equal(mediumFrame.readUInt16BE(2), 300);
  assert.equal(mediumFrame.subarray(4).toString('utf8'), mediumMsg);
});

test('WebSocket: decodeClientFrame desempaqueta frames enmascarados, close y ping', () => {
  // Simulación de frame de cliente enmascarado
  const text = 'Mensaje del cliente';
  const textBuf = Buffer.from(text, 'utf8');
  const maskKey = Buffer.from([0x12, 0x34, 0x56, 0x78]);
  const maskedPayload = Buffer.alloc(textBuf.length);
  for (let i = 0; i < textBuf.length; i++) {
    maskedPayload[i] = textBuf[i] ^ maskKey[i % 4];
  }

  const clientFrame = Buffer.concat([
    Buffer.from([0x81, 0x80 | textBuf.length]), // FIN=1, text, Mask bit=1
    maskKey,
    maskedPayload,
  ]);

  const decoded = decodeClientFrame(clientFrame);
  assert.ok(decoded);
  assert.equal(decoded.text, text);
  assert.equal(decoded.isClose, false);

  // Frame de cierre (opcode 0x08)
  const closeFrame = Buffer.from([0x88, 0x00]);
  const decodedClose = decodeClientFrame(closeFrame);
  assert.ok(decodedClose.isClose);

  // Frame de ping (opcode 0x09)
  const pingFrame = Buffer.from([0x89, 0x00]);
  const decodedPing = decodeClientFrame(pingFrame);
  assert.ok(decodedPing.isPing);
});

test('WebSocket E2E: difusión en tiempo real entre múltiples clientes conectados', async () => {
  const server = createServer();
  const wsServer = createWebSocketServer(server, { path: '/ws' });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const client1 = new WebSocket(`ws://localhost:${port}/ws`);
    const client2 = new WebSocket(`ws://localhost:${port}/ws`);

    await Promise.all([
      new Promise((resolve) => { client1.onopen = resolve; }),
      new Promise((resolve) => { client2.onopen = resolve; }),
    ]);

    assert.equal(wsServer.getClientsCount(), 2);

    // Cliente 2 escucha broadcast de actualización de despensa
    const messagePromise = new Promise((resolve) => {
      client2.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'PANTRY_UPDATED') {
          resolve(data);
        }
      };
    });

    // Servidor difunde actualización de despensa
    wsServer.broadcastPantryUpdate('add', { id: 99, name: 'Tomate Fresco', quantity: 500 });

    const received = await messagePromise;
    assert.equal(received.type, 'PANTRY_UPDATED');
    assert.equal(received.action, 'add');
    assert.equal(received.item.name, 'Tomate Fresco');

    // Cerrar clientes
    client1.close();
    client2.close();
  } finally {
    server.close();
  }
});
