"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, ShoppingCart, User, DollarSign } from "lucide-react";
import { useRealtime, RealtimeEvent, OrderEventData, RealtimeEventData } from "@/hooks/use-realtime";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface LiveOrder extends OrderEventData {
  timestamp: number;
  id: string;
}

export function LiveOrders() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const { subscribe, connected, connecting } = useRealtime({ autoConnect: true });

  useEffect(() => {
    // Subscribe to order events
    const unsubscribeCreated = subscribe<OrderEventData>(
      RealtimeEvent.ORDER_CREATED,
      (event: RealtimeEventData<OrderEventData>) => {
        if (!isPlaying) return;

        const newOrder: LiveOrder = {
          ...event.data,
          timestamp: event.timestamp,
          id: event.id,
        };

        setOrders((prev) => [newOrder, ...prev].slice(0, 20)); // Keep only last 20

        // Play notification sound
        playNotificationSound();

        // Show browser notification if permitted
        showNotification(newOrder);
      }
    );

    const unsubscribeUpdated = subscribe<OrderEventData>(
      RealtimeEvent.ORDER_UPDATED,
      (event: RealtimeEventData<OrderEventData>) => {
        setOrders((prev) =>
          prev.map((order) =>
            order.orderId === event.data.orderId
              ? { ...event.data, timestamp: event.timestamp, id: order.id }
              : order
          )
        );
      }
    );

    const unsubscribeCancelled = subscribe<OrderEventData>(
      RealtimeEvent.ORDER_CANCELLED,
      (event: RealtimeEventData<OrderEventData>) => {
        setOrders((prev) =>
          prev.filter((order) => order.orderId !== event.data.orderId)
        );
      }
    );

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeCancelled();
    };
  }, [subscribe, isPlaying]);

  const playNotificationSound = () => {
    if (typeof window !== "undefined" && isPlaying) {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  };

  const showNotification = (order: LiveOrder) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("Nuovo Ordine!", {
        body: `Ordine #${order.orderId} - €${order.total.toFixed(2)}`,
        icon: "/icons/order.png",
        tag: order.orderId,
      });
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      await Notification.requestPermission();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      processing: "bg-blue-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "In Attesa",
      processing: "In Elaborazione",
      completed: "Completato",
      cancelled: "Annullato",
    };
    return labels[status] || status;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Ordini in Tempo Reale
          </CardTitle>
          <CardDescription>
            {connected ? (
              <span className="flex items-center gap-1 text-green-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Connesso
              </span>
            ) : connecting ? (
              <span className="text-yellow-600">Connessione...</span>
            ) : (
              <span className="text-red-600">Disconnesso</span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title={isPlaying ? "Metti in pausa" : "Riprendi"}
          >
            {isPlaying ? (
              <Bell className="h-5 w-5 text-green-600" />
            ) : (
              <Bell className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <button
            onClick={requestNotificationPermission}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Abilita notifiche"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
              <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
              <p>Nessun ordine recente</p>
              <p className="text-sm">Gli ordini appariranno qui in tempo reale</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        #{order.orderId}
                      </Badge>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(order.timestamp), {
                        addSuffix: true,
                        locale: it,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Cliente {order.customerId.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-green-600">
                      <DollarSign className="h-4 w-4" />
                      <span>€{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">
                          €{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.items.length - 3} altri prodotti
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
