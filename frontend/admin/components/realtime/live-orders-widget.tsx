"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, TrendingUp, DollarSign, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/hooks/use-realtime";
import { RealtimeIndicator } from "./realtime-indicator";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface LiveStats {
  today_orders: number;
  today_revenue: number;
  pending_orders: number;
  orders_change: number;
}

interface LiveOrdersWidgetProps {
  websocketUrl?: string;
  pollingInterval?: number;
}

export function LiveOrdersWidget({
  websocketUrl = "ws://localhost:8000/ws/orders",
  pollingInterval = 5000,
}: LiveOrdersWidgetProps) {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<LiveStats>({
    today_orders: 0,
    today_revenue: 0,
    pending_orders: 0,
    orders_change: 0,
  });

  // WebSocket connection for real-time updates
  const { status, lastMessage, isConnected } = useRealtime({
    url: websocketUrl,
    onMessage: (data) => {
      if (data.type === "new_order") {
        setRecentOrders((prev) => [data.order, ...prev.slice(0, 4)]);
        setStats((prev) => ({
          ...prev,
          today_orders: prev.today_orders + 1,
          today_revenue: prev.today_revenue + data.order.total,
          pending_orders: prev.pending_orders + 1,
        }));
      } else if (data.type === "order_updated") {
        setRecentOrders((prev) =>
          prev.map((order) =>
            order.id === data.order.id ? data.order : order
          )
        );
      } else if (data.type === "stats_update") {
        setStats(data.stats);
      }
    },
  });

  // Fallback: polling when WebSocket is not available
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch("/api/admin/orders/live-stats");
          const data = await response.json();
          setStats(data.stats);
          setRecentOrders(data.recent_orders);
        } catch (error) {
          console.error("Failed to fetch live stats:", error);
        }
      }, pollingInterval);

      return () => clearInterval(interval);
    }
  }, [isConnected, pollingInterval]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      paid: "bg-green-500",
      processing: "bg-blue-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-600",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "In attesa",
      paid: "Pagato",
      processing: "In elaborazione",
      shipped: "Spedito",
      delivered: "Consegnato",
      cancelled: "Annullato",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ordini in Tempo Reale</h2>
        <RealtimeIndicator status={status} showLabel />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordini Oggi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today_orders}</div>
            {stats.orders_change !== 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stats.orders_change > 0 ? "+" : ""}
                {stats.orders_change}% vs ieri
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incasso Oggi</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.today_revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Sospeso</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConnected ? (
                <span className="text-green-500">Live</span>
              ) : (
                <span className="text-yellow-500">Polling</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Ordini Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nessun ordine recente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    />
                    <div>
                      <p className="font-medium text-sm">
                        #{order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatCurrency(order.total)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
