/**
 * PWA Installation Hook
 * Handles PWA install prompt and installation state
 */

import { useState, useEffect, useCallback } from "react";

/**
 * BeforeInstallPromptEvent interface
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

/**
 * PWA installation state
 */
export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: "ios" | "android" | "desktop" | "unknown";
}

/**
 * Hook return type
 */
export interface UsePWAReturn extends PWAState {
  installPrompt: BeforeInstallPromptEvent | null;
  install: () => Promise<boolean>;
  dismissPrompt: () => void;
  checkInstallability: () => void;
}

/**
 * Detect platform
 */
function detectPlatform(): PWAState["platform"] {
  if (typeof window === "undefined") return "unknown";
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "desktop";
}

/**
 * Check if app is installed
 */
function checkIsInstalled(): boolean {
  if (typeof window === "undefined") return false;
  
  // Check if running in standalone mode
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }
  
  // Check navigator standalone (iOS)
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  // Check URL parameter (Android)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("source") === "pwa") {
    return true;
  }
  
  return false;
}

/**
 * Check if app is in standalone mode
 */
function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Hook for PWA installation
 */
export function usePWA(): UsePWAReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform] = useState(detectPlatform());
  
  /**
   * Check installability
   */
  const checkInstallability = useCallback(() => {
    setIsInstalled(checkIsInstalled());
    setIsStandalone(checkIsStandalone());
    
    // If already installed, not installable
    if (checkIsInstalled()) {
      setIsInstallable(false);
    }
  }, []);
  
  /**
   * Handle install prompt
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check initial state
    checkInstallability();
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWA] Install prompt available");
      
      // Prevent default browser prompt
      e.preventDefault();
      
      // Store event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    
    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("[PWA] App installed");
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      
      // Track installation
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "pwa_installed", {
          event_category: "PWA",
          event_label: platform,
        });
      }
    };
    
    // Listen for display mode changes
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    
    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    displayModeQuery.addEventListener("change", handleDisplayModeChange);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, [platform, checkInstallability]);
  
  /**
   * Install PWA
   */
  const install = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      console.warn("[PWA] Install prompt not available");
      return false;
    }
    
    try {
      // Show install prompt
      await installPrompt.prompt();
      
      // Wait for user choice
      const choiceResult = await installPrompt.userChoice;
      
      console.log("[PWA] User choice:", choiceResult.outcome);
      
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted installation");
        
        // Track installation prompt
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "pwa_install_accepted", {
            event_category: "PWA",
            event_label: platform,
          });
        }
        
        // Clear prompt
        setInstallPrompt(null);
        setIsInstallable(false);
        
        return true;
      } else {
        console.log("[PWA] User dismissed installation");
        
        // Track dismissal
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "pwa_install_dismissed", {
            event_category: "PWA",
            event_label: platform,
          });
        }
        
        return false;
      }
    } catch (error) {
      console.error("[PWA] Installation failed:", error);
      return false;
    }
  }, [installPrompt, platform]);
  
  /**
   * Dismiss install prompt
   */
  const dismissPrompt = useCallback(() => {
    setInstallPrompt(null);
    setIsInstallable(false);
    
    // Store dismissal in localStorage
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    
    // Track dismissal
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "pwa_prompt_dismissed", {
        event_category: "PWA",
        event_label: platform,
      });
    }
  }, [platform]);
  
  return {
    installPrompt,
    isInstallable,
    isInstalled,
    isStandalone,
    platform,
    install,
    dismissPrompt,
    checkInstallability,
  };
}

/**
 * Check if install prompt was dismissed recently
 */
export function wasPromptDismissedRecently(days: number = 7): boolean {
  if (typeof window === "undefined") return false;
  
  const dismissed = localStorage.getItem("pwa-prompt-dismissed");
  
  if (!dismissed) return false;
  
  const dismissedTime = parseInt(dismissed, 10);
  const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
  
  return daysSinceDismissal < days;
}

/**
 * Get installation instructions for platform
 */
export function getInstallInstructions(platform: PWAState["platform"]): string[] {
  switch (platform) {
    case "ios":
      return [
        "Tap the Share button",
        'Select "Add to Home Screen"',
        'Tap "Add" to install',
      ];
    
    case "android":
      return [
        "Tap the menu button (⋮)",
        'Select "Add to Home Screen"',
        'Tap "Add" to install',
      ];
    
    case "desktop":
      return [
        "Click the install icon in the address bar",
        'Or use the browser menu "Install app"',
        "The app will open in its own window",
      ];
    
    default:
      return [
        "Use your browser's menu",
        'Look for "Add to Home Screen" or "Install"',
      ];
  }
}

/**
 * Check if browser supports PWA
 */
export function isPWASupported(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}
