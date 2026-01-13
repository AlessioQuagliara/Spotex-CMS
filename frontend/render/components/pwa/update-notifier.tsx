/**
 * Update Notifier Component
 * Notifies users when a new version of the app is available
 */

"use client";

import { useState, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";

export interface UpdateNotifierProps {
  /**
   * Position of the notifier
   */
  position?: "top" | "bottom";
  
  /**
   * Check for updates interval (milliseconds)
   */
  checkInterval?: number;
}

export function UpdateNotifier({
  position = "bottom",
  checkInterval = 60000, // 1 minute
}: UpdateNotifierProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  /**
   * Check for service worker updates
   */
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    
    // Get service worker registration
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);
      
      // Listen for updates
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[Update] New version available");
              setUpdateAvailable(true);
              
              // Track update notification
              if (typeof window !== "undefined" && (window as any).gtag) {
                (window as any).gtag("event", "update_available", {
                  event_category: "PWA",
                });
              }
            }
          });
        }
      });
    });
    
    // Check for updates periodically
    const intervalId = setInterval(() => {
      navigator.serviceWorker.ready.then((reg) => {
        console.log("[Update] Checking for updates...");
        reg.update();
      });
    }, checkInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [checkInterval]);
  
  /**
   * Handle update
   */
  const handleUpdate = () => {
    if (!registration || !registration.waiting) {
      return;
    }
    
    setIsUpdating(true);
    
    // Tell service worker to skip waiting
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    
    // Listen for controlling service worker change
    let refreshing = false;
    
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        console.log("[Update] Reloading page for update...");
        window.location.reload();
      }
    });
    
    // Track update action
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "update_installed", {
        event_category: "PWA",
      });
    }
  };
  
  /**
   * Handle dismiss
   */
  const handleDismiss = () => {
    setUpdateAvailable(false);
    
    // Track dismissal
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "update_dismissed", {
        event_category: "PWA",
      });
    }
  };
  
  if (!updateAvailable) {
    return null;
  }
  
  return (
    <div
      className={`fixed left-0 right-0 z-50 animate-slide-up ${
        position === "top" ? "top-0" : "bottom-0"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg dark:border-blue-700 dark:bg-blue-900/20">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Aggiornamento disponibile
              </h3>
              
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Una nuova versione dell'app è pronta. Aggiorna ora per accedere alle ultime funzionalità e miglioramenti.
              </p>
              
              {/* Actions */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {isUpdating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Aggiornamento...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>Aggiorna ora</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="text-sm font-medium text-blue-700 transition-colors hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                >
                  Più tardi
                </button>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-md p-1 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-500 dark:hover:bg-blue-900"
              aria-label="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Update badge (floating button)
 */
export function UpdateBadge() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    
    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });
    });
  }, []);
  
  const handleUpdate = async () => {
    setIsUpdating(true);
    
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  };
  
  if (!updateAvailable) {
    return null;
  }
  
  return (
    <button
      onClick={handleUpdate}
      disabled={isUpdating}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-50"
    >
      {isUpdating ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      <span>Aggiorna</span>
    </button>
  );
}
