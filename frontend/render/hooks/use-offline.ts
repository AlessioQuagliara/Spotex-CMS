/**
 * Offline Detection Hook
 * Monitors network connectivity and provides offline state
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Network information (experimental)
 */
interface NetworkInformation extends EventTarget {
  effectiveType: "slow-2g" | "2g" | "3g" | "4g";
  downlink: number;
  rtt: number;
  saveData: boolean;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
}

/**
 * Offline state
 */
export interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  effectiveType: NetworkInformation["effectiveType"] | "unknown";
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
}

/**
 * Hook return type
 */
export interface UseOfflineReturn extends OfflineState {
  checkConnection: () => Promise<boolean>;
  isSlowConnection: () => boolean;
}

/**
 * Get network information
 */
function getNetworkInformation(): NetworkInformation | null {
  if (typeof window === "undefined") return null;
  
  const nav = navigator as any;
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

/**
 * Check actual connectivity by pinging server
 */
async function checkServerConnection(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch("/api/health", {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-cache",
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn("[Offline] Server connection check failed:", error);
    return false;
  }
}

/**
 * Hook for offline detection
 */
export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [lastOffline, setLastOffline] = useState<Date | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInformation | null>(
    getNetworkInformation()
  );
  
  /**
   * Update online status
   */
  const updateOnlineStatus = useCallback((online: boolean) => {
    setIsOnline(online);
    
    if (online) {
      setLastOnline(new Date());
      
      // Track coming back online
      if (wasOffline) {
        console.log("[Offline] Connection restored");
        
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "connection_restored", {
            event_category: "Connectivity",
          });
        }
      }
      
      setWasOffline(false);
    } else {
      setLastOffline(new Date());
      setWasOffline(true);
      
      console.warn("[Offline] Connection lost");
      
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "connection_lost", {
          event_category: "Connectivity",
        });
      }
    }
  }, [wasOffline]);
  
  /**
   * Check connection to server
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    const connected = await checkServerConnection();
    updateOnlineStatus(connected);
    return connected;
  }, [updateOnlineStatus]);
  
  /**
   * Check if connection is slow
   */
  const isSlowConnection = useCallback((): boolean => {
    if (!networkInfo) return false;
    
    // Check effective type
    if (
      networkInfo.effectiveType === "slow-2g" ||
      networkInfo.effectiveType === "2g"
    ) {
      return true;
    }
    
    // Check RTT (Round Trip Time)
    if (networkInfo.rtt > 1000) {
      return true;
    }
    
    // Check downlink speed (Mbps)
    if (networkInfo.downlink < 1) {
      return true;
    }
    
    return false;
  }, [networkInfo]);
  
  /**
   * Setup event listeners
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Update initial state
    updateOnlineStatus(navigator.onLine);
    
    // Listen for online/offline events
    const handleOnline = () => {
      console.log("[Offline] Browser online event");
      updateOnlineStatus(true);
    };
    
    const handleOffline = () => {
      console.log("[Offline] Browser offline event");
      updateOnlineStatus(false);
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // Listen for network information changes
    const connection = getNetworkInformation();
    if (connection) {
      const handleConnectionChange = () => {
        console.log("[Offline] Network information changed");
        setNetworkInfo({ ...connection });
        
        // Check if connection became slow
        if (
          connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g"
        ) {
          console.warn("[Offline] Slow connection detected");
          
          if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("event", "slow_connection", {
              event_category: "Connectivity",
              event_label: connection.effectiveType,
            });
          }
        }
      };
      
      connection.addEventListener("change", handleConnectionChange);
      
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        connection.removeEventListener("change", handleConnectionChange);
      };
    }
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updateOnlineStatus]);
  
  /**
   * Periodic connection check
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check connection every 30 seconds if offline
    let intervalId: NodeJS.Timeout | null = null;
    
    if (!isOnline) {
      intervalId = setInterval(() => {
        console.log("[Offline] Periodic connection check...");
        checkConnection();
      }, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOnline, checkConnection]);
  
  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    effectiveType: networkInfo?.effectiveType || "unknown",
    downlink: networkInfo?.downlink || null,
    rtt: networkInfo?.rtt || null,
    saveData: networkInfo?.saveData || false,
    lastOnline,
    lastOffline,
    checkConnection,
    isSlowConnection,
  };
}

/**
 * Get offline duration
 */
export function getOfflineDuration(lastOnline: Date | null): string {
  if (!lastOnline) return "Unknown";
  
  const duration = Date.now() - lastOnline.getTime();
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Get connection quality label
 */
export function getConnectionQuality(
  effectiveType: NetworkInformation["effectiveType"] | "unknown"
): "excellent" | "good" | "fair" | "poor" | "unknown" {
  switch (effectiveType) {
    case "4g":
      return "excellent";
    case "3g":
      return "good";
    case "2g":
      return "fair";
    case "slow-2g":
      return "poor";
    default:
      return "unknown";
  }
}

/**
 * Estimate data usage reduction for save-data mode
 */
export function shouldReduceDataUsage(
  saveData: boolean,
  effectiveType: NetworkInformation["effectiveType"] | "unknown"
): boolean {
  // Save data mode explicitly enabled
  if (saveData) return true;
  
  // Slow connection detected
  if (effectiveType === "slow-2g" || effectiveType === "2g") {
    return true;
  }
  
  return false;
}
