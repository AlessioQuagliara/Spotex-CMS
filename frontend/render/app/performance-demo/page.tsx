"use client";

import { useEffect } from "react";
import { LocalizationProvider } from "@/contexts/localization-context";
import { OptimizedImage } from "@/components/performance/optimized-image";
import { LazySection } from "@/components/performance/lazy-section";
import { PWAInstallPrompt } from "@/components/performance/pwa-install-prompt";
import { OfflineIndicator } from "@/components/performance/offline-indicator";
import { LocaleSwitcher } from "@/components/localization/locale-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { registerServiceWorker, isAppInstalled } from "@/lib/pwa";
import { Zap, Image as ImageIcon, Download, Wifi } from "lucide-react";

export default function PerformanceDemoPage() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();
  }, []);

  const isInstalled = isAppInstalled();

  return (
    <LocalizationProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b p-4 sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Performance Demo</h1>
            <LocaleSwitcher />
          </div>
        </header>

        <main className="container mx-auto p-8 space-y-8">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  PWA Status
                </CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isInstalled ? "Installata" : "Non installata"}
                </div>
                <Badge
                  variant={isInstalled ? "default" : "outline"}
                  className="mt-2"
                >
                  {isInstalled ? "✓ Installata" : "Installa per prestazioni migliori"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Service Worker
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {"serviceWorker" in navigator ? "Supportato" : "Non supportato"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cache e offline mode
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Connessione
                </CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeof navigator !== "undefined" && navigator.onLine
                    ? "Online"
                    : "Offline"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Stato di rete
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Optimized Images Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Immagini Ottimizzate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Le immagini sono ottimizzate automaticamente con Next.js Image,
                supportano AVIF/WebP, lazy loading e blur placeholder
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                    <OptimizedImage
                      src={`https://images.unsplash.com/photo-148348909765${i}?w=400`}
                      alt={`Product ${i}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      priority={i === 1}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lazy Loading Section */}
          <LazySection rootMargin="200px">
            <Card>
              <CardHeader>
                <CardTitle>Lazy Loading</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Questo contenuto viene caricato solo quando entra nel viewport.
                  Scorri la pagina per vedere l'effetto.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[5, 6, 7].map((i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden">
                      <OptimizedImage
                        src={`https://images.unsplash.com/photo-148348909765${i}?w=600`}
                        alt={`Lazy ${i}`}
                        fill
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </LazySection>

          {/* Another Lazy Section */}
          <LazySection rootMargin="200px">
            <Card>
              <CardHeader>
                <CardTitle>Code Splitting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  I componenti sono caricati dinamicamente con code splitting.
                  Next.js automaticamente divide il codice per route.
                </p>
                <div className="space-y-2">
                  <Badge>Dynamic Import</Badge>
                  <Badge>React.lazy</Badge>
                  <Badge>Suspense</Badge>
                  <Badge>Route-based splitting</Badge>
                </div>
              </CardContent>
            </Card>
          </LazySection>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => {
                    if ("serviceWorker" in navigator) {
                      navigator.serviceWorker
                        .getRegistration()
                        .then((reg) => {
                          if (reg) {
                            alert("Service Worker attivo!");
                          } else {
                            alert("Service Worker non registrato");
                          }
                        });
                    }
                  }}
                >
                  Check Service Worker
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    caches.keys().then((names) => {
                      alert(`Cache attive: ${names.length}\n${names.join("\n")}`);
                    });
                  }}
                >
                  Check Cache
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const metrics = performance.getEntriesByType("navigation")[0] as any;
                    if (metrics) {
                      alert(
                        `Load Time: ${metrics.loadEventEnd - metrics.fetchStart}ms\n` +
                        `DOM Ready: ${metrics.domContentLoadedEventEnd - metrics.fetchStart}ms`
                      );
                    }
                  }}
                >
                  Performance Metrics
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>Tips:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Usa la tab Network in DevTools per vedere il caching</li>
                  <li>Testa offline mode disabilitando la rete</li>
                  <li>Controlla Lighthouse per performance score</li>
                  <li>Installa come PWA per esperienza offline completa</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Offline Indicator */}
        <OfflineIndicator />
      </div>
    </LocalizationProvider>
  );
}
