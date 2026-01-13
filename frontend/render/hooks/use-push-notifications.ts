/**
 * Push Notifications Hook
 * Handle push notification subscription and management
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Notification permission state
 */
export type NotificationPermission = "default" | "granted" | "denied";

/**
 * Push subscription state
 */
export interface PushSubscriptionState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook return type
 */
export interface UsePushNotificationsReturn extends PushSubscriptionState {
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
}

/**
 * VAPID public key (replace with your actual key)
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || "";

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Check if push notifications are supported
 */
function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Hook for push notifications
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: isPushSupported(),
    permission: typeof window !== "undefined" ? Notification.permission : "default",
    isSubscribed: false,
    subscription: null,
    loading: false,
    error: null,
  });
  
  /**
   * Check existing subscription
   */
  const checkSubscription = useCallback(async () => {
    if (!state.isSupported) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState((prev) => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription,
      }));
    } catch (error) {
      console.error("[Push] Failed to check subscription:", error);
    }
  }, [state.isSupported]);
  
  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!state.isSupported) {
      throw new Error("Push notifications not supported");
    }
    
    try {
      const permission = await Notification.requestPermission();
      
      setState((prev) => ({
        ...prev,
        permission,
      }));
      
      // Track permission grant
      if (permission === "granted" && typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "notification_permission_granted", {
          event_category: "Notifications",
        });
      }
      
      return permission;
    } catch (error) {
      console.error("[Push] Failed to request permission:", error);
      throw error;
    }
  }, [state.isSupported]);
  
  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!state.isSupported) {
      throw new Error("Push notifications not supported");
    }
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // Request permission if not granted
      if (state.permission !== "granted") {
        const permission = await requestPermission();
        
        if (permission !== "granted") {
          throw new Error("Notification permission denied");
        }
      }
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      
      // Send subscription to server
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });
      
      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
        loading: false,
      }));
      
      console.log("[Push] Subscribed successfully");
      
      // Track subscription
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "push_subscribed", {
          event_category: "Notifications",
        });
      }
      
      return subscription;
    } catch (error) {
      const err = error as Error;
      console.error("[Push] Failed to subscribe:", err);
      
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }));
      
      throw err;
    }
  }, [state.isSupported, state.permission, requestPermission]);
  
  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !state.subscription) {
      return false;
    }
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // Unsubscribe from push
      await state.subscription.unsubscribe();
      
      // Notify server
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(state.subscription),
      });
      
      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        loading: false,
      }));
      
      console.log("[Push] Unsubscribed successfully");
      
      // Track unsubscription
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "push_unsubscribed", {
          event_category: "Notifications",
        });
      }
      
      return true;
    } catch (error) {
      const err = error as Error;
      console.error("[Push] Failed to unsubscribe:", err);
      
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }));
      
      return false;
    }
  }, [state.isSupported, state.subscription]);
  
  /**
   * Send test notification
   */
  const sendTestNotification = useCallback(async () => {
    if (!state.isSupported || state.permission !== "granted") {
      throw new Error("Notifications not available");
    }
    
    try {
      await fetch("/api/notifications/test", {
        method: "POST",
      });
      
      console.log("[Push] Test notification sent");
    } catch (error) {
      console.error("[Push] Failed to send test notification:", error);
      throw error;
    }
  }, [state.isSupported, state.permission]);
  
  /**
   * Check subscription on mount
   */
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);
  
  /**
   * Update permission state
   */
  useEffect(() => {
    if (!state.isSupported) return;
    
    const handlePermissionChange = () => {
      setState((prev) => ({
        ...prev,
        permission: Notification.permission,
      }));
    };
    
    // Note: permission change event is not widely supported
    // This is mainly for completeness
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "notifications" as PermissionName }).then((status) => {
        status.addEventListener("change", handlePermissionChange);
      });
    }
  }, [state.isSupported]);
  
  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

/**
 * Show local notification (without push)
 */
export async function showNotification(
  title: string,
  options: NotificationOptions = {}
): Promise<Notification | null> {
  if (!("Notification" in window)) {
    console.warn("[Notification] API not supported");
    return null;
  }
  
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      return null;
    }
  }
  
  const notification = new Notification(title, {
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    ...options,
  });
  
  return notification;
}

/**
 * Notification templates
 */
export const NotificationTemplates = {
  orderPlaced: (orderNumber: string) => ({
    title: "Ordine confermato!",
    body: `Il tuo ordine #${orderNumber} è stato confermato`,
    icon: "/icons/icon-192x192.png",
    tag: "order-placed",
    data: { url: `/orders/${orderNumber}` },
  }),
  
  orderShipped: (orderNumber: string) => ({
    title: "Ordine spedito!",
    body: `Il tuo ordine #${orderNumber} è stato spedito`,
    icon: "/icons/icon-192x192.png",
    tag: "order-shipped",
    data: { url: `/orders/${orderNumber}` },
  }),
  
  priceAlert: (productName: string, price: number) => ({
    title: "Prezzo ridotto!",
    body: `${productName} ora a €${price}`,
    icon: "/icons/icon-192x192.png",
    tag: "price-alert",
  }),
  
  backInStock: (productName: string) => ({
    title: "Disponibile!",
    body: `${productName} è tornato disponibile`,
    icon: "/icons/icon-192x192.png",
    tag: "back-in-stock",
  }),
};
