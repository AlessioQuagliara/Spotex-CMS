"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Package, PackageX } from "lucide-react";
import { useRealtime, RealtimeEvent, InventoryEventData, RealtimeEventData } from "@/hooks/use-realtime";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";

interface InventoryAlert extends InventoryEventData {
  timestamp: number;
  id: string;
  type: "low" | "out";
}

export function InventoryAlerts() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const { subscribe, connected, connecting } = useRealtime({ autoConnect: true });

  useEffect(() => {
    // Subscribe to inventory events
    const unsubscribeLow = subscribe<InventoryEventData>(
      RealtimeEvent.INVENTORY_LOW,
      (event: RealtimeEventData<InventoryEventData>) => {
        const newAlert: InventoryAlert = {
          ...event.data,
          timestamp: event.timestamp,
          id: event.id,
          type: "low",
        };

        setAlerts((prev) => {
          // Remove existing alert for same product
          const filtered = prev.filter((a) => a.productId !== newAlert.productId);
          return [newAlert, ...filtered].slice(0, 50); // Keep only last 50
        });

        // Play alert sound
        playAlertSound("low");
      }
    );

    const unsubscribeOut = subscribe<InventoryEventData>(
      RealtimeEvent.INVENTORY_OUT,
      (event: RealtimeEventData<InventoryEventData>) => {
        const newAlert: InventoryAlert = {
          ...event.data,
          timestamp: event.timestamp,
          id: event.id,
          type: "out",
        };

        setAlerts((prev) => {
          const filtered = prev.filter((a) => a.productId !== newAlert.productId);
          return [newAlert, ...filtered].slice(0, 50);
        });

        // Play critical alert sound
        playAlertSound("out");
      }
    );

    const unsubscribeUpdated = subscribe<InventoryEventData>(
      RealtimeEvent.INVENTORY_UPDATED,
      (event: RealtimeEventData<InventoryEventData>) => {
        // Remove alert if stock is back to normal
        if (event.data.currentStock > event.data.threshold) {
          setAlerts((prev) =>
            prev.filter((alert) => alert.productId !== event.data.productId)
          );
        }
      }
    );

    return () => {
      unsubscribeLow();
      unsubscribeOut();
      unsubscribeUpdated();
    };
  }, [subscribe]);

  const playAlertSound = (severity: "low" | "out") => {
    if (typeof window !== "undefined") {
      const audio = new Audio(
        severity === "out" ? "/sounds/critical.mp3" : "/sounds/warning.mp3"
      );
      audio.volume = 0.4;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.type === filter;
  });

  const criticalCount = alerts.filter((a) => a.type === "out").length;
  const warningCount = alerts.filter((a) => a.type === "low").length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Avvisi Inventario
            </CardTitle>
            <CardDescription>
              {connected ? (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Monitoraggio attivo
                </span>
              ) : connecting ? (
                <span className="text-yellow-600">Connessione...</span>
              ) : (
                <span className="text-red-600">Disconnesso</span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={criticalCount > 0 ? "destructive" : "outline"}>
              {criticalCount} Esauriti
            </Badge>
            <Badge variant={warningCount > 0 ? "secondary" : "outline"}>
              {warningCount} Bassi
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Tutti ({alerts.length})
          </button>
          <button
            onClick={() => setFilter("out")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === "out"
                ? "bg-red-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Esauriti ({criticalCount})
          </button>
          <button
            onClick={() => setFilter("low")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === "low"
                ? "bg-yellow-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Stock Basso ({warningCount})
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <Package className="h-16 w-16 mb-4 opacity-20" />
              <p>Nessun avviso</p>
              <p className="text-sm">
                {filter === "all"
                  ? "Tutti i prodotti hanno stock sufficiente"
                  : filter === "out"
                  ? "Nessun prodotto esaurito"
                  : "Nessun prodotto con stock basso"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={`/products/${alert.productId}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {alert.type === "out" ? (
                        <PackageX className="h-5 w-5 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <h4 className="font-semibold">{alert.productName}</h4>
                        <p className="text-xs text-muted-foreground">
                          SKU: {alert.sku}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.timestamp), {
                        addSuffix: true,
                        locale: it,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Stock Attuale
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            alert.currentStock === 0
                              ? "text-red-500"
                              : "text-yellow-500"
                          }`}
                        >
                          {alert.currentStock}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Soglia</p>
                        <p className="text-2xl font-bold text-muted-foreground">
                          {alert.threshold}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={alert.type === "out" ? "destructive" : "secondary"}
                    >
                      {alert.type === "out" ? "Esaurito" : "Stock Basso"}
                    </Badge>
                  </div>

                  {alert.type === "out" && (
                    <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      Prodotto non disponibile per gli acquisti
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
