"use client";

import { useState } from "react";
import { LiveOrdersWidget } from "@/components/realtime/live-orders-widget";
import { NotificationCenter, Notification } from "@/components/realtime/notification-center";

export default function RealtimePage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "success",
      title: "Nuovo Ordine",
      message: "Ordine #ORD-12345 da Mario Rossi per €250.00",
      timestamp: new Date(Date.now() - 60000),
      read: false,
    },
    {
      id: "2",
      type: "info",
      title: "Pagamento Ricevuto",
      message: "Pagamento confermato per ordine #ORD-12344",
      timestamp: new Date(Date.now() - 120000),
      read: false,
    },
    {
      id: "3",
      type: "warning",
      title: "Stock Basso",
      message: "T-Shirt Premium ha solo 5 unità rimanenti",
      timestamp: new Date(Date.now() - 300000),
      read: true,
    },
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Real-Time</h1>
          <p className="text-muted-foreground mt-1">
            Monitora ordini e notifiche in tempo reale
          </p>
        </div>
        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDismiss={handleDismiss}
          onClearAll={handleClearAll}
        />
      </div>

      <LiveOrdersWidget />
    </div>
  );
}
