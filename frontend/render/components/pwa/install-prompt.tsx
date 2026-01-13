/**
 * PWA Install Prompt Component
 * Shows a banner prompting users to install the PWA
 */

"use client";

import { useState, useEffect } from "react";
import { usePWA, getInstallInstructions } from "@/hooks/use-pwa";
import { X, Download, Smartphone } from "lucide-react";

export interface InstallPromptProps {
  /**
   * Auto-show prompt after delay (milliseconds)
   */
  autoShowDelay?: number;
  
  /**
   * Position of the prompt
   */
  position?: "top" | "bottom";
  
  /**
   * Custom title
   */
  title?: string;
  
  /**
   * Custom description
   */
  description?: string;
  
  /**
   * Show platform-specific instructions
   */
  showInstructions?: boolean;
}

export function InstallPrompt({
  autoShowDelay = 10000,
  position = "bottom",
  title,
  description,
  showInstructions = false,
}: InstallPromptProps) {
  const { isInstallable, isInstalled, platform, install, dismissPrompt } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  
  /**
   * Auto-show prompt after delay
   */
  useEffect(() => {
    if (!isInstallable || isInstalled) return;
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, autoShowDelay);
    
    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, autoShowDelay]);
  
  /**
   * Handle install click
   */
  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await install();
      
      if (success) {
        setIsVisible(false);
      }
    } finally {
      setIsInstalling(false);
    }
  };
  
  /**
   * Handle dismiss
   */
  const handleDismiss = () => {
    setIsVisible(false);
    dismissPrompt();
  };
  
  // Don't render if not installable or already installed
  if (!isInstallable || isInstalled || !isVisible) {
    return null;
  }
  
  const instructions = showInstructions ? getInstallInstructions(platform) : null;
  
  return (
    <div
      className={`fixed left-0 right-0 z-50 animate-slide-up ${
        position === "top" ? "top-0" : "bottom-0"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {platform === "ios" || platform === "android" ? (
                  <Smartphone className="h-5 w-5 text-primary" />
                ) : (
                  <Download className="h-5 w-5 text-primary" />
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {title || "Installa l'app Spotex"}
              </h3>
              
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {description ||
                  "Accesso rapido, notifiche push e funziona offline. Installa l'app per un'esperienza migliore!"}
              </p>
              
              {/* Platform-specific instructions */}
              {instructions && (
                <div className="mt-3 space-y-1">
                  {instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {instruction}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Actions */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isInstalling ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Installazione...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Installa</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  Non ora
                </button>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
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
 * Mini install button (for header/navbar)
 */
export function InstallButton() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);
  
  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };
  
  if (!isInstallable || isInstalled) {
    return null;
  }
  
  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
      aria-label="Installa app"
    >
      {isInstalling ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Installa</span>
    </button>
  );
}
