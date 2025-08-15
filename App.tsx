import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { RawMessage, ProcessedData, P0Settings, ConnectionStatus } from './types';
import Dashboard from './components/Dashboard';
import { getLatest, getSeries } from './services/api';
import { processSeries, getMessageTimestamp } from './services/rainProcessor';
import useLocalStorage from './hooks/useLocalStorage';
import useWebSocket, { WebSocketStatus } from './hooks/useWebSocket';
import { DEFAULT_K_FACTOR, DEFAULT_P0_SETTINGS, TIMEZONE, DEFAULT_TOPIC, WEBSOCKET_URL, POLLING_INTERVAL_MS } from './constants';

const MIN_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 60000;

const getSequenceNumber = (counter: number | number[] | undefined): number => {
    if (Array.isArray(counter)) {
        return counter[0] ?? 0;
    }
    if (typeof counter === 'number') {
        return counter;
    }
    return 0;
};

const App: React.FC = () => {
  const [data, setData] = useState<ProcessedData | null>(null);
  const [rawMessages, setRawMessages] = useState<RawMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTopic] = useState<string>(DEFAULT_TOPIC);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');
  
  const lastSeenRef = useRef<{ receivedTs: number, seq: number }>({ receivedTs: 0, seq: 0 });
  const backoffDelay = useRef<number>(MIN_BACKOFF_MS);

  const [kFactor, setKFactor] = useLocalStorage<number>('rain-kFactor', DEFAULT_K_FACTOR);
  const [p0Settings, setP0Settings] = useLocalStorage<P0Settings>('rain-p0Settings', DEFAULT_P0_SETTINGS);
  
  const mergeAndDeduplicate = useCallback((existing: RawMessage[], incoming: RawMessage[]): RawMessage[] => {
      const messageMap = new Map<string, RawMessage>();
      [...existing, ...incoming].forEach(msg => {
          const ts = msg.commMetaData?.receivedTimestamp ?? msg.readTimestamp;
          const seq = getSequenceNumber(msg.commMetaData?.sequenceCounter);
          if (ts) {
              const key = `${activeTopic}-${msg.nodeId}-${ts}-${seq}`;
              messageMap.set(key, msg);
          }
      });
      return Array.from(messageMap.values()).sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));
  },[activeTopic]);
  
  const handleWsMessage = useCallback((event: MessageEvent) => {
      try {
        const newMessage: RawMessage = JSON.parse(event.data);
        if (newMessage.commMetaData?.receivedTimestamp) {
            const newReceivedTs = new Date(newMessage.commMetaData.receivedTimestamp).getTime();
            lastSeenRef.current = {
                receivedTs: newReceivedTs,
                seq: getSequenceNumber(newMessage.commMetaData.sequenceCounter),
            };
        }
        setRawMessages(prev => mergeAndDeduplicate(prev, [newMessage]));
      } catch (e) {
        console.error("Failed to parse WebSocket message", e);
      }
  }, [mergeAndDeduplicate]);

  const wsStatus: WebSocketStatus = useWebSocket(WEBSOCKET_URL, handleWsMessage);

  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const messages = await getSeries(activeTopic, 2000);
        
        // Correctly find the latest message based on receivedTimestamp and sequenceCounter
        // to initialize the polling reference correctly.
        let maxReceivedTs = 0;
        let maxSeq = 0;

        for (const msg of messages) {
            const currentTs = msg.commMetaData?.receivedTimestamp ? new Date(msg.commMetaData.receivedTimestamp).getTime() : 0;
            const currentSeq = getSequenceNumber(msg.commMetaData?.sequenceCounter);
            
            if (currentTs > maxReceivedTs) {
                maxReceivedTs = currentTs;
                maxSeq = currentSeq;
            } else if (currentTs === maxReceivedTs && currentSeq > maxSeq) {
                maxSeq = currentSeq;
            }
        }

        if (maxReceivedTs > 0) {
            lastSeenRef.current = {
                receivedTs: maxReceivedTs,
                seq: maxSeq
            };
        }
        
        setRawMessages(messages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar dados iniciais.');
      } finally {
        setIsLoading(false);
      }
    };
    initialFetch();
  }, [activeTopic]);

  // Effect to manage connection status display based on WebSocket status
  useEffect(() => {
    if (wsStatus === 'OPEN') {
        setConnectionStatus('WS_CONNECTED');
        backoffDelay.current = MIN_BACKOFF_MS; // Reset backoff on successful WS connection
    } else {
        setConnectionStatus(wsStatus === 'CONNECTING' ? 'CONNECTING' : 'POLLING');
    }
  }, [wsStatus]);

  // Effect to manage the polling logic when connectionStatus is 'POLLING'
  useEffect(() => {
    if (connectionStatus !== 'POLLING' || isLoading) {
        return;
    }

    let isCancelled = false;
    let pollTimeoutId: number;

    const poll = async () => {
      let success = false;
      try {
        const latestMessage = await getLatest(activeTopic);
        const latestReceivedTs = latestMessage.commMetaData?.receivedTimestamp ? new Date(latestMessage.commMetaData.receivedTimestamp).getTime() : 0;
        const latestSeq = getSequenceNumber(latestMessage.commMetaData?.sequenceCounter);
            
        if (!isCancelled && (latestReceivedTs > lastSeenRef.current.receivedTs || (latestReceivedTs === lastSeenRef.current.receivedTs && latestSeq > lastSeenRef.current.seq))) {
            const newMessages = await getSeries(activeTopic, 200);
            if (!isCancelled) {
                setRawMessages(prev => mergeAndDeduplicate(prev, newMessages));
                lastSeenRef.current = { receivedTs: latestReceivedTs, seq: latestSeq };
            }
        }
        
        setError(null);
        backoffDelay.current = MIN_BACKOFF_MS;
        success = true;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Falha ao buscar novos dados.';
        setError(errorMessage);
        backoffDelay.current = Math.min(backoffDelay.current * 2, MAX_BACKOFF_MS);
        success = false;
      }

      if (!isCancelled) {
        const delay = success ? POLLING_INTERVAL_MS : backoffDelay.current;
        pollTimeoutId = window.setTimeout(poll, delay);
      }
    };

    poll(); // Start the polling loop

    return () => {
        isCancelled = true;
        clearTimeout(pollTimeoutId);
    };
  }, [connectionStatus, isLoading, activeTopic, mergeAndDeduplicate]);

  useEffect(() => {
    if (rawMessages.length > 0) {
      try {
        const processed = processSeries(rawMessages, kFactor, p0Settings, TIMEZONE);
        setData(processed);
      } catch (err) {
         setError('Erro ao processar os dados de chuva.');
         console.error(err);
      }
    }
  }, [rawMessages, kFactor, p0Settings]);

  return (
    <Dashboard
      data={data}
      isLoading={isLoading}
      error={error}
      topic={activeTopic}
      kFactor={kFactor}
      setKFactor={setKFactor}
      p0Settings={p0Settings}
      setP0Settings={setP0Settings}
      connectionStatus={connectionStatus}
    />
  );
};

export default App;