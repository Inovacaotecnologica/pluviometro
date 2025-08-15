import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketStatus = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

const useWebSocket = (url: string, onMessage: (event: MessageEvent) => void) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<number | null>(null);
  const heartbeatTimer = useRef<number | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('CLOSED');

  const connect = useCallback(() => {
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      return;
    }

    setStatus('CONNECTING');
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setStatus('OPEN');
      reconnectAttempts.current = 0;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      
      // Start heartbeat
      heartbeatTimer.current = window.setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send('ping');
        }
      }, 30000);
    };

    ws.current.onmessage = onMessage;

    ws.current.onerror = null; // The error event is not descriptive, onclose is more useful.

    ws.current.onclose = (event: CloseEvent) => {
      setStatus('CLOSED');
      console.warn(
        `WebSocket connection closed. ` +
        `Code: ${event.code}, Reason: "${event.reason}", Was Clean: ${event.wasClean}. ` +
        `Please check if the WebSocket server at ${url} is running.`
      );
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);

      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;
      
      reconnectTimer.current = window.setTimeout(connect, delay);
    };
  }, [url, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      if (ws.current) {
        ws.current.onclose = null; // prevent reconnect on manual close
        ws.current.close();
      }
    };
  }, [connect]);

  return status;
};

export default useWebSocket;
