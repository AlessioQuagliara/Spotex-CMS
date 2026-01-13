"use client";

// PWA utilities and service worker registration

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] Service Worker registered:", registration.scope);

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available
                if (confirm("Nuova versione disponibile. Aggiornare?")) {
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("[PWA] Service Worker registration failed:", error);
      });

    // Handle controller change
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[PWA] Service Worker updated");
    });
  });
}

export function unregisterServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log("[PWA] Service Worker unregistered");
      })
      .catch((error) => {
        console.error("[PWA] Error unregistering Service Worker:", error);
      });
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("[PWA] Notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const key = urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
    );
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key.buffer as ArrayBuffer,
    });

    console.log("[PWA] Push subscription:", subscription);
    return subscription;
  } catch (error) {
    console.error("[PWA] Push subscription failed:", error);
    return null;
  }
}

// Install PWA prompt
export function installPWA() {
  // @ts-ignore
  const deferredPrompt = window.deferredPrompt;
  
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted installation");
      }
      // @ts-ignore
      window.deferredPrompt = null;
    });
  }
}

// Detect if app is installed
export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-ignore
    window.navigator.standalone === true
  );
}

// Check if offline
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

// Network status hooks
export function setupNetworkListeners(
  onOnline: () => void,
  onOffline: () => void
) {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

// Utility functions
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

// Clear all caches
export async function clearAppCache() {
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log("[PWA] Cache cleared");
  }
}
