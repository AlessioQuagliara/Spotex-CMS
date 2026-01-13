/**
 * Offline Indicator Component
 * Shows connection status to users
 */

"use client";

import React from "react";
import { useOffline, getOfflineDuration, getConnectionQuality } from "@/hooks/use-offline";
import { WifiOff, Wifi, AlertTriangle, CheckCircle } from "lucide-react";

export interface OfflineIndicatorProps {
  /**
   * Position of the indicator
   */
  position?: "top" | "bottom";
  
  /**
   * Show connection quality for slow connections
   */
  showQuality?: boolean;
  
  /**
   * Auto-hide after connection restored (milliseconds)
   */
  autoHideDelay?: number;
}

export function OfflineIndicator({
  position = "top",
  showQuality = true,
  autoHideDelay = 3000,
}: OfflineIndicatorProps) {
  const {
    isOnline,
    isOffline,
    wasOffline,
    effectiveType,
    lastOnline,
    isSlowConnection,
  } = useOffline();
  
  const [showRestoredMessage, setShowRestoredMessage] = React.useState(false);
  
  /**
   * Show "connection restored" message briefly
   */
  React.useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRestoredMessage(true);
      
      const timer = setTimeout(() => {
        setShowRestoredMessage(false);
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, autoHideDelay]);
  
  // Don't show if online and never was offline
  if (isOnline && !showRestoredMessage && !isSlowConnection()) {
    return null;
  }
  
  const connectionQuality = getConnectionQuality(effectiveType);
  const offlineDuration = isOffline && lastOnline ? getOfflineDuration(lastOnline) : null;
  
  return (
    <div
      className={`fixed left-0 right-0 z-50 ${
        position === "top" ? "top-0" : "bottom-0"
      }`}
    >
      <div
        className={`mx-auto max-w-7xl px-4 py-2 transition-all ${
          isOffline
            ? "bg-red-500 text-white"
            : showRestoredMessage
            ? "bg-green-500 text-white"
            : "bg-yellow-500 text-white"
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          {/* Icon */}
          {isOffline ? (
            <WifiOff className="h-4 w-4" />
          ) : showRestoredMessage ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          
          {/* Message */}
          <span>
            {isOffline
              ? offlineDuration
                ? `Offline da ${offlineDuration}`
                : "Nessuna connessione a Internet"
              : showRestoredMessage
              ? "Connessione ripristinata!"
              : showQuality && isSlowConnection()
              ? `Connessione lenta (${effectiveType})`
              : null}
          </span>
          
          {/* Quality indicator */}
          {showQuality && !isOffline && !showRestoredMessage && (
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {connectionQuality}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Floating offline badge (corner indicator)
 */
export function OfflineBadge() {
  const { isOffline } = useOffline();
  
  if (!isOffline) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-pulse">
      <div className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
        <WifiOff className="h-4 w-4" />
        <span>Offline</span>
      </div>
    </div>
  );
}

/**
 * Connection status icon (for navbar)
 */
export function ConnectionStatus() {
  const { isOnline, effectiveType, isSlowConnection } = useOffline();
  
  return (
    <div className="flex items-center gap-1">
      {isOnline ? (
        <>
          <Wifi
            className={`h-4 w-4 ${
              isSlowConnection() ? "text-yellow-500" : "text-green-500"
            }`}
          />
          {isSlowConnection() && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              {effectiveType}
            </span>
          )}
        </>
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
    </div>
  );
}
