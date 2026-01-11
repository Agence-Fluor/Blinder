// WebSocket service as fallback for push notifications

// Get WebSocket URL - use backend URL, not frontend dev server
const getWebSocketUrl = (): string => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'ws://127.0.0.1:3000';
  } else {
    // Production: convert https:// to wss:// or http:// to ws://
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${hostname}:3000`;
  }
};

const WS_BASE_URL = import.meta.env.VITE_WS_URL || getWebSocketUrl();

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export type WebSocketMessageHandler = (message: WebSocketMessage) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Set<WebSocketMessageHandler> = new Set();
  private phone: string | null = null;
  private isConnecting = false;

  async connect(phone: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (this.isConnecting) {
      return; // Connection in progress
    }

    this.phone = phone;
    this.isConnecting = true;

    try {
      const wsUrl = `${WS_BASE_URL}/ws?phone=${encodeURIComponent(phone)}`;
      console.log('Connecting WebSocket to:', wsUrl, 'WS_BASE_URL:', WS_BASE_URL);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      this.isConnecting = false;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    setTimeout(() => {
      if (this.phone) {
        this.connect(this.phone);
      }
    }, delay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
    this.phone = null;
    this.reconnectAttempts = 0;
  }

  addMessageHandler(handler: WebSocketMessageHandler): void {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: WebSocketMessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

// Connect WebSocket (fallback when push is not available)
export async function connectWebSocket(phone: string): Promise<void> {
  await wsManager.connect(phone);
}

// Disconnect WebSocket
export function disconnectWebSocket(): void {
  wsManager.disconnect();
}

// Add message handler
export function onWebSocketMessage(handler: WebSocketMessageHandler): () => void {
  wsManager.addMessageHandler(handler);
  // Return cleanup function
  return () => wsManager.removeMessageHandler(handler);
}

// Send message via WebSocket
export function sendWebSocketMessage(message: WebSocketMessage): void {
  wsManager.send(message);
}

// Check if WebSocket is connected
export function isWebSocketConnected(): boolean {
  return wsManager.isConnected();
}

