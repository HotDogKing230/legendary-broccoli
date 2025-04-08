import { useState, useEffect, useCallback } from 'react';
import { MinerState } from '@shared/schema';

type WebSocketMessage = {
  type: string;
  minerState?: MinerState;
  globalStats?: any;
  settings?: any;
  data?: any;
};

export function useMiningWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [latestMinerState, setLatestMinerState] = useState<MinerState | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Handle different message types
        switch (message.type) {
          case 'minerState':
            if (message.data) {
              setLatestMinerState(message.data);
            }
            break;
            
          case 'globalStats':
            if (message.data) {
              setGlobalStats(message.data);
            }
            break;
            
          case 'minerUpdate':
            if (message.minerState) {
              setLatestMinerState(message.minerState);
            }
            if (message.globalStats) {
              setGlobalStats(message.globalStats);
            }
            break;
            
          case 'settingsUpdate':
            // Handle settings update if needed
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      ws.close();
    };
  }, []);
  
  // Function to send messages to the server
  const sendMessage = useCallback((type: string, data: any = {}) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type,
        ...data
      }));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, [socket]);
  
  return {
    isConnected,
    globalStats,
    latestMinerState,
    sendMessage
  };
}