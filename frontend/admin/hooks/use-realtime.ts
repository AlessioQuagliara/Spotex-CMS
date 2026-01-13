"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/**
 * Real-time event types with strong typing
 */
export enum RealtimeEvent {
  // Orders
  ORDER_CREATED = "order:created",
  ORDER_UPDATED = "order:updated",
  ORDER_CANCELLED = "order:cancelled",
  
  // Inventory
  INVENTORY_LOW = "inventory:low",
  INVENTORY_OUT = "inventory:out",
  INVENTORY_UPDATED = "inventory:updated",
  
  // Customers
  CUSTOMER_ONLINE = "customer:online",
  CUSTOMER_OFFLINE = "customer:offline",
  CUSTOMER_ACTIVITY = "customer:activity",
  
  // Notifications
  NOTIFICATION = "notification",
  
  // System
  SYSTEM_ALERT = "system:alert",
  SYSTEM_MAINTENANCE = "system:maintenance",
}

export interface RealtimeEventData<T = any> {
  type: RealtimeEvent;
  data: T;
  timestamp: number;
  id: string;
}

export interface OrderEventData {
  orderId: string;
  customerId: string;
  total: number;
  status: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface InventoryEventData {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
}

export interface CustomerActivityData {
  customerId: string;
  email?: string;
  action: string;
  page?: string;
  sessionId: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  link?: string;
}

type EventHandler<T = any> = (data: RealtimeEventData<T>) => void;

interface UseRealtimeOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  useFallback?: boolean;
  url?: string;
}

interface UseRealtimeReturn {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  status: ConnectionStatus;
  subscribe: <T = any>(event: RealtimeEvent, handler: EventHandler<T>) => () => void;
  unsubscribe: (event: RealtimeEvent, handler: EventHandler) => void;
  emit: (event: string, data: any) => void;
  send: (data: any) => boolean;
  connect: () => void;
  disconnect: () => void;
  lastMessage: any;
  isConnected: boolean;
}

/**
 * WebSocket connection manager with Socket.io and SSE fallback
 * Supports automatic reconnection and re-subscription on reconnect
 */
export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const {
    autoConnect = true,
    reconnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
    useFallback = true,
    url,
  } = options;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const subscribersRef = useRef<Map<RealtimeEvent, Set<EventHandler>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const useFallbackRef = useRef(false);

  /**
   * Initialize Socket.io connection with automatic re-subscription
   */
  const initSocketConnection = useCallback(() => {
    if (socketRef.current?.connected) return;

    setConnecting(true);
    setStatus("connecting");
    setError(null);

    const token = localStorage.getItem("token");
    const apiUrl = url || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    socketRef.current = io(apiUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: reconnect,
      reconnectionAttempts,
      reconnectionDelay: reconnectDelay,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("[Realtime] Socket.io connected");
      setConnected(true);
      setConnecting(false);
      setStatus("connected");
      setError(null);
      reconnectAttemptsRef.current = 0;

      // Re-subscribe to all events on reconnect
      subscribersRef.current.forEach((handlers, event) => {
        socket.emit("subscribe", event);
        console.log(`[Realtime] Re-subscribed to ${event}`);
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("[Realtime] Socket.io disconnected:", reason);
      setConnected(false);
      setStatus("disconnected");

      if (reason === "io server disconnect") {
        // Server disconnected, manual reconnect needed
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("[Realtime] Socket.io connection error:", err);
      setError(err.message);
      setConnecting(false);
      setStatus("error");

      // Try SSE fallback if enabled and max attempts reached
      if (useFallback && !useFallbackRef.current && reconnectAttemptsRef.current >= reconnectAttempts) {
        console.log("[Realtime] Switching to SSE fallback");
        useFallbackRef.current = true;
        socket.disconnect();
        initSSEConnection();
      }
    });

    socket.on("error", (err) => {
      console.error("[Realtime] Socket.io error:", err);
      setError(err.message || "Connection error");
      setStatus("error");
    });

    // Handle incoming events with type safety
    socket.onAny((event: string, data: any) => {
      const eventType = event as RealtimeEvent;
      const handlers = subscribersRef.current.get(eventType);
      
      if (handlers) {
        const eventData: RealtimeEventData = {
          type: eventType,
          data,
          timestamp: Date.now(),
          id: `${eventType}-${Date.now()}-${Math.random()}`,
        };

        setLastMessage(eventData);

        handlers.forEach((handler) => {
          try {
            handler(eventData);
          } catch (err) {
            console.error(`[Realtime] Error in handler for ${event}:`, err);
          }
        });
      }
    });
  }, [reconnect, reconnectAttempts, reconnectDelay, useFallback, url]);

  /**
   * Initialize Server-Sent Events fallback
   */
  const initSSEConnection = useCallback(() => {
    if (eventSourceRef.current) return;

    const token = localStorage.getItem("token");
    const apiUrl = url || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const sseUrl = `${apiUrl}/realtime/events?token=${encodeURIComponent(token || "")}`;

    eventSourceRef.current = new EventSource(sseUrl);

    const eventSource = eventSourceRef.current;

    eventSource.onopen = () => {
      console.log("[Realtime] SSE connected");
      setConnected(true);
      setConnecting(false);
      setStatus("connected");
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    eventSource.onerror = (err) => {
      console.error("[Realtime] SSE error:", err);
      setError("SSE connection failed");
      setConnected(false);
      setStatus("error");
      
      // Retry connection with exponential backoff
      if (reconnect && reconnectAttemptsRef.current < reconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          eventSource.close();
          eventSourceRef.current = null;
          initSSEConnection();
        }, delay);
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const eventData: RealtimeEventData = JSON.parse(event.data);
        setLastMessage(eventData);
        
        const handlers = subscribersRef.current.get(eventData.type);
        
        if (handlers) {
          handlers.forEach((handler) => {
            try {
              handler(eventData);
            } catch (err) {
              console.error(`[Realtime] Error in SSE handler for ${eventData.type}:`, err);
            }
          });
        }
      } catch (err) {
        console.error("[Realtime] Error parsing SSE message:", err);
      }
    };
  }, [reconnect, reconnectAttempts, reconnectDelay, url]);

  /**
   * Subscribe to an event with automatic re-subscription on reconnect
   */
  const subscribe = useCallback(
    <T = any>(event: RealtimeEvent, handler: EventHandler<T>): (() => void) => {
      if (!subscribersRef.current.has(event)) {
        subscribersRef.current.set(event, new Set());
      }

      subscribersRef.current.get(event)!.add(handler as EventHandler);

      // Subscribe on socket if connected
      if (socketRef.current?.connected) {
        socketRef.current.emit("subscribe", event);
        console.log(`[Realtime] Subscribed to ${event}`);
      }

      // Return unsubscribe function
      return () => unsubscribe(event, handler);
    },
    []
  );

  /**
   * Unsubscribe from an event
   */
  const unsubscribe = useCallback((event: RealtimeEvent, handler: EventHandler) => {
    const handlers = subscribersRef.current.get(event);
    
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        subscribersRef.current.delete(event);
        
        // Unsubscribe on socket if connected
        if (socketRef.current?.connected) {
          socketRef.current.emit("unsubscribe", event);
          console.log(`[Realtime] Unsubscribed from ${event}`);
        }
      }
    }
  }, []);

  /**
   * Emit an event to server
   */
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    } else {
      console.warn("[Realtime] Cannot emit event: not connected");
      return false;
    }
  }, []);

  /**
   * Send data (alias for emit for backward compatibility)
   */
  const send = useCallback(
    (data: any) => {
      return emit("message", data);
    },
    [emit]
  );

  /**
   * Manually connect
   */
  const connect = useCallback(() => {
    if (!useFallbackRef.current) {
      initSocketConnection();
    } else {
      initSSEConnection();
    }
  }, [initSocketConnection, initSSEConnection]);

  /**
   * Manually disconnect
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnected(false);
    setConnecting(false);
    setStatus("disconnected");
  }, []);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  return {
    connected,
    connecting,
    error,
    status,
    subscribe,
    unsubscribe,
    emit,
    send,
    connect,
    disconnect,
    lastMessage,
    isConnected: connected,
  };
}
