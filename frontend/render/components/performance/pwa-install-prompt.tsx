"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { installPWA, isAppInstalled } from "@/lib/pwa";

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (isAppInstalled()) {
      return;
    }

    // Check if user dismissed prompt before
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
      // @ts-ignore
      window.deferredPrompt = e;
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("[PWA] User accepted installation");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="p-4 shadow-lg border-2">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Installa l'App</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Installa la nostra app per un'esperienza più veloce e offline
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstall}>
                Installa
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Non ora
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </Card>
    </div>
  );
}
