/**
 * Cliente WebSocket en el navegador para ZeroWaste Pantry.
 * Gestiona reconexión automática, eventos en tiempo real y comunicación bidireccional.
 */

export function createWebSocketClient({ path = '/ws', reconnectInterval = 2500 } = {}) {
  let ws = null;
  let isConnecting = false;
  let reconnectTimer = null;
  const listeners = new Map();
  const statusListeners = new Set();

  function notifyStatus(status, details = {}) {
    for (const cb of statusListeners) {
      try {
        cb(status, details);
      } catch (err) {
        console.error('[WS Client] Error en listener de estado:', err);
      }
    }
  }

  function getWsUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:3000';
    return `${protocol}//${host}${path}`;
  }

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    isConnecting = true;
    notifyStatus('connecting');

    try {
      const url = getWsUrl();
      ws = new WebSocket(url);

      ws.onopen = () => {
        isConnecting = false;
        clearTimeout(reconnectTimer);
        notifyStatus('connected', { url });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type) {
            const handlers = listeners.get(data.type) || [];
            for (const handler of handlers) {
              handler(data);
            }
            // Listener comodín '*'
            const wildcardHandlers = listeners.get('*') || [];
            for (const handler of wildcardHandlers) {
              handler(data);
            }
          }
        } catch (err) {
          console.warn('[WS Client] Mensaje no-JSON recibido:', event.data);
        }
      };

      ws.onclose = (event) => {
        isConnecting = false;
        notifyStatus('disconnected', { code: event.code, reason: event.reason });
        scheduleReconnect();
      };

      ws.onerror = (err) => {
        isConnecting = false;
        notifyStatus('error', { error: err });
        ws.close();
      };
    } catch (err) {
      isConnecting = false;
      notifyStatus('error', { error: err });
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }

  return {
    connect,
    disconnect() {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    },
    on(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type).add(handler);
      return () => listeners.get(type).delete(handler);
    },
    onStatusChange(cb) {
      statusListeners.add(cb);
      return () => statusListeners.delete(cb);
    },
    send(type, payload = {}) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...payload }));
        return true;
      }
      return false;
    },
    broadcastAlert(title, message) {
      return this.send('BROADCAST_ALERT', { title, message });
    },
    isConnected() {
      return ws && ws.readyState === WebSocket.OPEN;
    },
  };
}
