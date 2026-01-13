/**
 * Background Sync Hook
 * Handles background synchronization of data when offline
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useOffline } from "./use-offline";

/**
 * Sync item
 */
export interface SyncItem<T = any> {
  id: string;
  tag: string;
  data: T;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: "pending" | "syncing" | "synced" | "failed";
}

/**
 * Sync options
 */
export interface SyncOptions {
  tag: string;
  maxRetries?: number;
  retryDelay?: number;
  persistent?: boolean;
}

/**
 * Hook return type
 */
export interface UseSyncReturn {
  pendingItems: SyncItem[];
  syncItem: <T>(data: T, options: SyncOptions) => Promise<string>;
  syncAll: () => Promise<void>;
  cancelSync: (id: string) => void;
  clearSynced: () => void;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

/**
 * Storage key for sync queue
 */
const SYNC_QUEUE_KEY = "spotex-sync-queue";

/**
 * Load sync queue from storage
 */
function loadSyncQueue(): SyncItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("[Sync] Failed to load sync queue:", error);
    return [];
  }
}

/**
 * Save sync queue to storage
 */
function saveSyncQueue(items: SyncItem[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("[Sync] Failed to save sync queue:", error);
  }
}

/**
 * Register background sync (Service Worker API)
 */
async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if ("sync" in registration) {
      await (registration as any).sync.register(tag);
      console.log(`[Sync] Background sync registered: ${tag}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("[Sync] Failed to register background sync:", error);
    return false;
  }
}

/**
 * Hook for background sync
 */
export function useSync(): UseSyncReturn {
  const [pendingItems, setPendingItems] = useState<SyncItem[]>(loadSyncQueue);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { isOnline } = useOffline();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Add item to sync queue
   */
  const syncItem = useCallback(
    async <T,>(data: T, options: SyncOptions): Promise<string> => {
      const id = `${options.tag}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const item: SyncItem<T> = {
        id,
        tag: options.tag,
        data,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: options.maxRetries || 3,
        status: "pending",
      };
      
      setPendingItems((prev) => {
        const updated = [...prev, item];
        if (options.persistent !== false) {
          saveSyncQueue(updated);
        }
        return updated;
      });
      
      // Try to register background sync
      await registerBackgroundSync(options.tag);
      
      // If online, try to sync immediately
      if (isOnline) {
        syncAll();
      }
      
      console.log(`[Sync] Item queued: ${id}`);
      
      return id;
    },
    [isOnline]
  );
  
  /**
   * Sync single item
   */
  const syncSingleItem = useCallback(async (item: SyncItem): Promise<boolean> => {
    console.log(`[Sync] Syncing item: ${item.id}`);
    
    // Update status
    setPendingItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "syncing" } : i))
    );
    
    try {
      // Send to server based on tag
      let endpoint = "/api/sync";
      
      switch (item.tag) {
        case "sync-cart":
          endpoint = "/api/cart/sync";
          break;
        case "sync-orders":
          endpoint = "/api/orders/sync";
          break;
        case "sync-wishlist":
          endpoint = "/api/wishlist/sync";
          break;
        case "sync-profile":
          endpoint = "/api/profile/sync";
          break;
      }
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item.data),
      });
      
      if (response.ok) {
        console.log(`[Sync] Item synced successfully: ${item.id}`);
        
        // Update status
        setPendingItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "synced" } : i))
        );
        
        // Track success
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "sync_success", {
            event_category: "Background Sync",
            event_label: item.tag,
          });
        }
        
        return true;
      } else {
        throw new Error(`Sync failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error(`[Sync] Failed to sync item ${item.id}:`, error);
      
      // Increment retry count
      setPendingItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                retries: i.retries + 1,
                status: i.retries + 1 >= i.maxRetries ? "failed" : "pending",
              }
            : i
        )
      );
      
      // Track failure
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "sync_failed", {
          event_category: "Background Sync",
          event_label: item.tag,
          value: item.retries + 1,
        });
      }
      
      return false;
    }
  }, []);
  
  /**
   * Sync all pending items
   */
  const syncAll = useCallback(async () => {
    if (isSyncing) {
      console.log("[Sync] Already syncing");
      return;
    }
    
    const itemsToSync = pendingItems.filter(
      (item) => item.status === "pending" && item.retries < item.maxRetries
    );
    
    if (itemsToSync.length === 0) {
      console.log("[Sync] No items to sync");
      return;
    }
    
    console.log(`[Sync] Syncing ${itemsToSync.length} items`);
    setIsSyncing(true);
    
    try {
      // Sync items in parallel (with limit)
      const PARALLEL_LIMIT = 3;
      
      for (let i = 0; i < itemsToSync.length; i += PARALLEL_LIMIT) {
        const batch = itemsToSync.slice(i, i + PARALLEL_LIMIT);
        await Promise.all(batch.map((item) => syncSingleItem(item)));
      }
      
      setLastSyncTime(new Date());
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, pendingItems, syncSingleItem]);
  
  /**
   * Cancel sync
   */
  const cancelSync = useCallback((id: string) => {
    setPendingItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveSyncQueue(updated);
      return updated;
    });
    
    console.log(`[Sync] Sync cancelled: ${id}`);
  }, []);
  
  /**
   * Clear synced items
   */
  const clearSynced = useCallback(() => {
    setPendingItems((prev) => {
      const updated = prev.filter((item) => item.status !== "synced");
      saveSyncQueue(updated);
      return updated;
    });
    
    console.log("[Sync] Synced items cleared");
  }, []);
  
  /**
   * Auto-sync when coming online
   */
  useEffect(() => {
    if (isOnline && pendingItems.length > 0) {
      console.log("[Sync] Connection restored, syncing pending items");
      
      // Delay sync to avoid immediate retry after connection
      syncTimeoutRef.current = setTimeout(() => {
        syncAll();
      }, 2000);
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, pendingItems.length, syncAll]);
  
  /**
   * Periodic sync check
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check every 5 minutes
    const intervalId = setInterval(() => {
      if (isOnline && pendingItems.length > 0) {
        console.log("[Sync] Periodic sync check");
        syncAll();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isOnline, pendingItems.length, syncAll]);
  
  /**
   * Save queue to storage when items change
   */
  useEffect(() => {
    saveSyncQueue(pendingItems);
  }, [pendingItems]);
  
  /**
   * Clear old synced items
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Clear items older than 7 days
    const intervalId = setInterval(() => {
      setPendingItems((prev) => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const updated = prev.filter(
          (item) =>
            item.status !== "synced" || item.timestamp > sevenDaysAgo
        );
        
        if (updated.length !== prev.length) {
          saveSyncQueue(updated);
          console.log(`[Sync] Cleared ${prev.length - updated.length} old items`);
        }
        
        return updated;
      });
    }, 24 * 60 * 60 * 1000); // Daily
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  return {
    pendingItems,
    syncItem,
    syncAll,
    cancelSync,
    clearSynced,
    isSyncing,
    lastSyncTime,
  };
}

/**
 * Get sync queue statistics
 */
export function getSyncStats(items: SyncItem[]): {
  total: number;
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
} {
  return {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    syncing: items.filter((i) => i.status === "syncing").length,
    synced: items.filter((i) => i.status === "synced").length,
    failed: items.filter((i) => i.status === "failed").length,
  };
}
