"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

/**
 * Cart item structure
 */
export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  inStock: boolean;
}

export interface Cart {
  items: CartItem[];
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  currency: string;
  updatedAt: number;
}

interface PriceUpdate {
  productId: string;
  oldPrice: number;
  newPrice: number;
}

interface StockUpdate {
  productId: string;
  inStock: boolean;
  quantity: number;
}

interface CartSyncOptions {
  autoSync?: boolean;
  enableCrossTab?: boolean;
  enableRealtime?: boolean;
  syncInterval?: number;
  storageKey?: string;
}

interface UseCartSyncReturn {
  cart: Cart;
  connected: boolean;
  syncing: boolean;
  addItem: (item: Omit<CartItem, "inStock">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  priceUpdates: PriceUpdate[];
  stockUpdates: StockUpdate[];
  refreshPrices: () => Promise<void>;
  checkStock: () => Promise<void>;
}

const STORAGE_KEY = "spotex_cart";
const BROADCAST_CHANNEL_NAME = "spotex_cart_sync";

/**
 * Hook for real-time cart synchronization across tabs and with server
 * Features:
 * - Cross-tab synchronization via BroadcastChannel API
 * - Real-time price updates via Socket.io
 * - Stock availability checks
 * - Automatic sync with server
 */
export function useCartSync(options: CartSyncOptions = {}): UseCartSyncReturn {
  const {
    autoSync = true,
    enableCrossTab = true,
    enableRealtime = true,
    syncInterval = 30000, // 30 seconds
    storageKey = STORAGE_KEY,
  } = options;

  const [cart, setCart] = useState<Cart>({
    items: [],
    total: 0,
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    currency: "EUR",
    updatedAt: Date.now(),
  });

  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);

  /**
   * Initialize Socket.io connection for real-time updates
   */
  const initSocketConnection = useCallback(() => {
    if (!enableRealtime || socketRef.current?.connected) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const sessionId = getSessionId();

    socketRef.current = io(apiUrl, {
      auth: { sessionId },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("[CartSync] Socket.io connected");
      setConnected(true);

      // Send current cart to server
      socket.emit("cart:sync", cart);
    });

    socket.on("disconnect", () => {
      console.log("[CartSync] Socket.io disconnected");
      setConnected(false);
    });

    // Listen for price updates
    socket.on("cart:price-update", (update: PriceUpdate) => {
      console.log("[CartSync] Price update received:", update);
      
      setPriceUpdates((prev) => [...prev, update]);

      // Update cart item price
      setCart((prevCart) => {
        const newItems = prevCart.items.map((item) =>
          item.productId === update.productId
            ? { ...item, price: update.newPrice }
            : item
        );
        return calculateCartTotals({ ...prevCart, items: newItems });
      });

      // Show notification
      showPriceUpdateNotification(update);
    });

    // Listen for stock updates
    socket.on("cart:stock-update", (update: StockUpdate) => {
      console.log("[CartSync] Stock update received:", update);
      
      setStockUpdates((prev) => [...prev, update]);

      // Update cart item stock status
      setCart((prevCart) => {
        const newItems = prevCart.items.map((item) =>
          item.productId === update.productId
            ? { ...item, inStock: update.inStock }
            : item
        );
        return { ...prevCart, items: newItems, updatedAt: Date.now() };
      });

      // Show notification if out of stock
      if (!update.inStock) {
        showStockUpdateNotification(update);
      }
    });

    // Listen for cart updates from other devices
    socket.on("cart:updated", (updatedCart: Cart) => {
      console.log("[CartSync] Cart updated from server");
      setCart(updatedCart);
      saveCartToStorage(updatedCart);
    });
  }, [enableRealtime, cart]);

  /**
   * Initialize BroadcastChannel for cross-tab synchronization
   */
  const initBroadcastChannel = useCallback(() => {
    if (!enableCrossTab || typeof BroadcastChannel === "undefined") return;

    broadcastChannelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    broadcastChannelRef.current.onmessage = (event) => {
      const { type, data } = event.data;

      switch (type) {
        case "cart:update":
          console.log("[CartSync] Cart updated from another tab");
          setCart(data);
          break;

        case "cart:clear":
          console.log("[CartSync] Cart cleared from another tab");
          setCart({
            items: [],
            total: 0,
            subtotal: 0,
            tax: 0,
            shipping: 0,
            discount: 0,
            currency: "EUR",
            updatedAt: Date.now(),
          });
          break;

        case "cart:item-added":
        case "cart:item-removed":
        case "cart:quantity-updated":
          // Reload cart from storage
          loadCartFromStorage();
          break;
      }
    };
  }, [enableCrossTab]);

  /**
   * Broadcast cart update to other tabs
   */
  const broadcastUpdate = useCallback(
    (type: string, data?: any) => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type, data });
      }
    },
    []
  );

  /**
   * Load cart from localStorage
   */
  const loadCartFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedCart = JSON.parse(stored);
        setCart(parsedCart);
        return parsedCart;
      }
    } catch (error) {
      console.error("[CartSync] Error loading cart from storage:", error);
    }
    return null;
  }, [storageKey]);

  /**
   * Save cart to localStorage
   */
  const saveCartToStorage = useCallback(
    (cartData: Cart) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(cartData));
      } catch (error) {
        console.error("[CartSync] Error saving cart to storage:", error);
      }
    },
    [storageKey]
  );

  /**
   * Calculate cart totals
   */
  const calculateCartTotals = (cartData: Cart): Cart => {
    const subtotal = cartData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const tax = subtotal * 0.22; // 22% IVA
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over €50
    const total = subtotal + tax + shipping - cartData.discount;

    return {
      ...cartData,
      subtotal,
      tax,
      shipping,
      total,
      updatedAt: Date.now(),
    };
  };

  /**
   * Sync cart with server
   */
  const syncWithServer = useCallback(async () => {
    if (!autoSync || !socketRef.current?.connected) return;

    // Avoid too frequent syncs
    const now = Date.now();
    if (now - lastSyncRef.current < 5000) return;

    setSyncing(true);
    lastSyncRef.current = now;

    try {
      socketRef.current.emit("cart:sync", cart);
      console.log("[CartSync] Cart synced with server");
    } catch (error) {
      console.error("[CartSync] Error syncing cart:", error);
    } finally {
      setSyncing(false);
    }
  }, [autoSync, cart]);

  /**
   * Add item to cart
   */
  const addItem = useCallback(
    (item: Omit<CartItem, "inStock">) => {
      setCart((prevCart) => {
        const existingItem = prevCart.items.find(
          (i) => i.productId === item.productId
        );

        let newItems: CartItem[];
        if (existingItem) {
          // Update quantity
          newItems = prevCart.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        } else {
          // Add new item
          newItems = [...prevCart.items, { ...item, inStock: true }];
        }

        const newCart = calculateCartTotals({ ...prevCart, items: newItems });
        saveCartToStorage(newCart);
        broadcastUpdate("cart:item-added", item);
        
        // Sync with server
        if (socketRef.current?.connected) {
          socketRef.current.emit("cart:add-item", item);
        }

        return newCart;
      });
    },
    [saveCartToStorage, broadcastUpdate]
  );

  /**
   * Remove item from cart
   */
  const removeItem = useCallback(
    (productId: string) => {
      setCart((prevCart) => {
        const newItems = prevCart.items.filter((i) => i.productId !== productId);
        const newCart = calculateCartTotals({ ...prevCart, items: newItems });
        saveCartToStorage(newCart);
        broadcastUpdate("cart:item-removed", productId);
        
        // Sync with server
        if (socketRef.current?.connected) {
          socketRef.current.emit("cart:remove-item", productId);
        }

        return newCart;
      });
    },
    [saveCartToStorage, broadcastUpdate]
  );

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setCart((prevCart) => {
        const newItems = prevCart.items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        );
        const newCart = calculateCartTotals({ ...prevCart, items: newItems });
        saveCartToStorage(newCart);
        broadcastUpdate("cart:quantity-updated", { productId, quantity });
        
        // Sync with server
        if (socketRef.current?.connected) {
          socketRef.current.emit("cart:update-quantity", { productId, quantity });
        }

        return newCart;
      });
    },
    [removeItem, saveCartToStorage, broadcastUpdate]
  );

  /**
   * Clear cart
   */
  const clearCart = useCallback(() => {
    const emptyCart: Cart = {
      items: [],
      total: 0,
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      currency: "EUR",
      updatedAt: Date.now(),
    };

    setCart(emptyCart);
    saveCartToStorage(emptyCart);
    broadcastUpdate("cart:clear");
    
    // Sync with server
    if (socketRef.current?.connected) {
      socketRef.current.emit("cart:clear");
    }
  }, [saveCartToStorage, broadcastUpdate]);

  /**
   * Refresh prices from server
   */
  const refreshPrices = useCallback(async () => {
    if (!socketRef.current?.connected) return;

    setSyncing(true);
    try {
      const productIds = cart.items.map((item) => item.productId);
      socketRef.current.emit("cart:check-prices", productIds);
    } catch (error) {
      console.error("[CartSync] Error refreshing prices:", error);
    } finally {
      setSyncing(false);
    }
  }, [cart.items]);

  /**
   * Check stock availability
   */
  const checkStock = useCallback(async () => {
    if (!socketRef.current?.connected) return;

    setSyncing(true);
    try {
      const productIds = cart.items.map((item) => item.productId);
      socketRef.current.emit("cart:check-stock", productIds);
    } catch (error) {
      console.error("[CartSync] Error checking stock:", error);
    } finally {
      setSyncing(false);
    }
  }, [cart.items]);

  /**
   * Get or create session ID
   */
  function getSessionId(): string {
    let sessionId = sessionStorage.getItem("spotex_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("spotex_session_id", sessionId);
    }
    return sessionId;
  }

  /**
   * Show price update notification
   */
  function showPriceUpdateNotification(update: PriceUpdate) {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Prezzo Aggiornato", {
          body: `Il prezzo è cambiato da €${update.oldPrice.toFixed(2)} a €${update.newPrice.toFixed(2)}`,
          icon: "/icons/cart.png",
        });
      }
    }
  }

  /**
   * Show stock update notification
   */
  function showStockUpdateNotification(update: StockUpdate) {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Prodotto Non Disponibile", {
          body: "Un prodotto nel tuo carrello non è più disponibile",
          icon: "/icons/warning.png",
        });
      }
    }
  }

  /**
   * Initialize on mount
   */
  useEffect(() => {
    // Load cart from storage
    loadCartFromStorage();

    // Initialize connections
    if (enableRealtime) {
      initSocketConnection();
    }

    if (enableCrossTab) {
      initBroadcastChannel();
    }

    return () => {
      // Cleanup
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Sync cart periodically
   */
  useEffect(() => {
    if (!autoSync || !enableRealtime) return;

    syncTimeoutRef.current = setInterval(() => {
      syncWithServer();
    }, syncInterval);

    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
      }
    };
  }, [autoSync, enableRealtime, syncInterval, syncWithServer]);

  /**
   * Save cart to storage on changes
   */
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart, saveCartToStorage]);

  return {
    cart,
    connected,
    syncing,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    priceUpdates,
    stockUpdates,
    refreshPrices,
    checkStock,
  };
}
