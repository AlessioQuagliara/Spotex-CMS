"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Bell,
  BellOff,
  Check,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
} from "lucide-react";
import {
  useRealtime,
  RealtimeEvent,
  NotificationData,
  OrderEventData,
  InventoryEventData,
  RealtimeEventData,
} from "@/hooks/use-realtime";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";

interface RealtimeNotification extends NotificationData {
  timestamp: number;
  read: boolean;
  type: RealtimeEvent;
}

type SeverityFilter = "all" | "info" | "warning" | "error" | "success";

/**
 * Full-page notification center with real-time updates
 */
export function NotificationCenterFullPage() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { subscribe, connected, connecting } = useRealtime({ autoConnect: true });

  useEffect(() => {
    if (!isEnabled) return;

    // Subscribe to all notification types
    const subscriptions: (() => void)[] = [];

    // Generic notifications
    subscriptions.push(
      subscribe<NotificationData>(
        RealtimeEvent.NOTIFICATION,
        (event: RealtimeEventData<NotificationData>) => {
          addNotification({
            ...event.data,
            timestamp: event.timestamp,
            read: false,
            type: RealtimeEvent.NOTIFICATION,
          });
        }
      )
    );

    // Order notifications
    subscriptions.push(
      subscribe<OrderEventData>(
        RealtimeEvent.ORDER_CREATED,
        (event: RealtimeEventData<OrderEventData>) => {
          addNotification({
            id: event.id,
            title: "Nuovo Ordine",
            message: `Ordine #${event.data.orderId} - €${event.data.total.toFixed(2)}`,
            severity: "success",
            link: `/orders/${event.data.orderId}`,
            timestamp: event.timestamp,
            read: false,
            type: RealtimeEvent.ORDER_CREATED,
          });
        }
      )
    );

    subscriptions.push(
      subscribe<OrderEventData>(
        RealtimeEvent.ORDER_CANCELLED,
        (event: RealtimeEventData<OrderEventData>) => {
          addNotification({
            id: event.id,
            title: "Ordine Annullato",
            message: `L'ordine #${event.data.orderId} è stato annullato`,
            severity: "warning",
            link: `/orders/${event.data.orderId}`,
            timestamp: event.timestamp,
            read: false,
            type: RealtimeEvent.ORDER_CANCELLED,
          });
        }
      )
    );

    // Inventory notifications
    subscriptions.push(
      subscribe<InventoryEventData>(
        RealtimeEvent.INVENTORY_LOW,
        (event: RealtimeEventData<InventoryEventData>) => {
          addNotification({
            id: event.id,
            title: "Stock Basso",
            message: `${event.data.productName} ha solo ${event.data.currentStock} unità rimanenti`,
            severity: "warning",
            link: `/products/${event.data.productId}`,
            timestamp: event.timestamp,
            read: false,
            type: RealtimeEvent.INVENTORY_LOW,
          });
        }
      )
    );

    subscriptions.push(
      subscribe<InventoryEventData>(
        RealtimeEvent.INVENTORY_OUT,
        (event: RealtimeEventData<InventoryEventData>) => {
          addNotification({
            id: event.id,
            title: "Prodotto Esaurito",
            message: `${event.data.productName} è esaurito!`,
            severity: "error",
            link: `/products/${event.data.productId}`,
            timestamp: event.timestamp,
            read: false,
            type: RealtimeEvent.INVENTORY_OUT,
          });
        }
      )
    );

    // System notifications
    subscriptions.push(
      subscribe<{ message: string; details?: string }>(
        RealtimeEvent.SYSTEM_ALERT,
        (event) => {
          addNotification({
            id: event.id,
            title: "Avviso Sistema",
            message: event.data.message,
            severity: "warning",
            timestamp: event.timestamp,
            read: false,
            type: RealtimeEvent.SYSTEM_ALERT,
          });
        }
      )
    );

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [subscribe, isEnabled]);

  const addNotification = (notification: RealtimeNotification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 100)); // Keep last 100

    // Play sound
    playNotificationSound(notification.severity);

    // Show browser notification
    if (notification.severity === "error" || notification.severity === "warning") {
      showBrowserNotification(notification);
    }
  };

  const playNotificationSound = (severity: string) => {
    if (typeof window !== "undefined") {
      const soundMap: Record<string, string> = {
        error: "/sounds/error.mp3",
        warning: "/sounds/warning.mp3",
        success: "/sounds/success.mp3",
        info: "/sounds/info.mp3",
      };

      const audio = new Audio(soundMap[severity] || soundMap.info);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  };

  const showBrowserNotification = (notification: RealtimeNotification) => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/icons/notification.png",
        tag: notification.id,
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (showUnreadOnly && n.read) return false;
    if (filter === "all") return true;
    return n.severity === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getSeverityIcon = (severity: string) => {
    const icons: Record<string, JSX.Element> = {
      info: <Info className="h-5 w-5 text-blue-500" />,
      warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      error: <AlertCircle className="h-5 w-5 text-red-500" />,
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
    };
    return icons[severity] || icons.info;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      info: "bg-blue-50 border-blue-200",
      warning: "bg-yellow-50 border-yellow-200",
      error: "bg-red-50 border-red-200",
      success: "bg-green-50 border-green-200",
    };
    return colors[severity] || colors.info;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Centro Notifiche
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEnabled(!isEnabled)}
            >
              {isEnabled ? (
                <Bell className="h-4 w-4 mr-1" />
              ) : (
                <BellOff className="h-4 w-4 mr-1" />
              )}
              {isEnabled ? "Attive" : "Disattivate"}
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Segna tutte lette
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                <X className="h-4 w-4 mr-1" />
                Cancella tutto
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Tutte
          </button>
          <button
            onClick={() => setFilter("success")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === "success"
                ? "bg-green-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Successo
          </button>
          <button
            onClick={() => setFilter("info")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === "info"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setFilter("warning")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === "warning"
                ? "bg-yellow-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Avvisi
          </button>
          <button
            onClick={() => setFilter("error")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === "error"
                ? "bg-red-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Errori
          </button>
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              showUnreadOnly
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {showUnreadOnly ? "Solo non lette" : "Tutte"}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
              <Bell className="h-16 w-16 mb-4 opacity-20" />
              <p>Nessuna notifica</p>
              <p className="text-sm">
                {showUnreadOnly
                  ? "Tutte le notifiche sono state lette"
                  : "Le notifiche appariranno qui"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const NotificationContent = (
                  <div
                    className={`p-4 border rounded-lg transition-colors animate-fade-in ${
                      getSeverityColor(notification.severity)
                    } ${notification.read ? "opacity-60" : ""} ${
                      notification.link ? "hover:bg-opacity-80 cursor-pointer" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        {getSeverityIcon(notification.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{notification.title}</h4>
                            {!notification.read && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                            locale: it,
                          })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Rimuovi"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="mt-2"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Segna come letta
                      </Button>
                    )}
                  </div>
                );

                return notification.link ? (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {NotificationContent}
                  </Link>
                ) : (
                  <div key={notification.id}>{NotificationContent}</div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
