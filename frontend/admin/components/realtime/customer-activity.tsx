"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Activity, Eye, MousePointer } from "lucide-react";
import { useRealtime, RealtimeEvent, CustomerActivityData, RealtimeEventData } from "@/hooks/use-realtime";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface OnlineCustomer {
  customerId: string;
  email?: string;
  sessionId: string;
  lastActivity: number;
  currentPage?: string;
  activityCount: number;
}

interface ActivityLog extends CustomerActivityData {
  timestamp: number;
  id: string;
}

export function CustomerActivity() {
  const [onlineCustomers, setOnlineCustomers] = useState<Map<string, OnlineCustomer>>(new Map());
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [view, setView] = useState<"visitors" | "activity">("visitors");
  const { subscribe, connected, connecting } = useRealtime({ autoConnect: true });

  useEffect(() => {
    // Subscribe to customer events
    const unsubscribeOnline = subscribe<{ customerId: string; email?: string; sessionId: string }>(
      RealtimeEvent.CUSTOMER_ONLINE,
      (event) => {
        setOnlineCustomers((prev) => {
          const next = new Map(prev);
          next.set(event.data.sessionId, {
            customerId: event.data.customerId,
            email: event.data.email,
            sessionId: event.data.sessionId,
            lastActivity: event.timestamp,
            activityCount: 0,
          });
          return next;
        });
      }
    );

    const unsubscribeOffline = subscribe<{ sessionId: string }>(
      RealtimeEvent.CUSTOMER_OFFLINE,
      (event) => {
        setOnlineCustomers((prev) => {
          const next = new Map(prev);
          next.delete(event.data.sessionId);
          return next;
        });
      }
    );

    const unsubscribeActivity = subscribe<CustomerActivityData>(
      RealtimeEvent.CUSTOMER_ACTIVITY,
      (event: RealtimeEventData<CustomerActivityData>) => {
        // Update online customer's activity
        setOnlineCustomers((prev) => {
          const next = new Map(prev);
          const customer = next.get(event.data.sessionId);
          if (customer) {
            next.set(event.data.sessionId, {
              ...customer,
              lastActivity: event.timestamp,
              currentPage: event.data.page,
              activityCount: customer.activityCount + 1,
            });
          }
          return next;
        });

        // Add to recent activity
        const activity: ActivityLog = {
          ...event.data,
          timestamp: event.timestamp,
          id: event.id,
        };

        setRecentActivity((prev) => [activity, ...prev].slice(0, 50));
      }
    );

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeActivity();
    };
  }, [subscribe]);

  // Clean up stale sessions (no activity in last 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOnlineCustomers((prev) => {
        const next = new Map(prev);
        for (const [sessionId, customer] of next) {
          if (now - customer.lastActivity > 5 * 60 * 1000) {
            next.delete(sessionId);
          }
        }
        return next;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const onlineCustomersArray = Array.from(onlineCustomers.values()).sort(
    (a, b) => b.lastActivity - a.lastActivity
  );

  const getActionIcon = (action: string) => {
    const icons: Record<string, JSX.Element> = {
      view: <Eye className="h-4 w-4" />,
      click: <MousePointer className="h-4 w-4" />,
      scroll: <Activity className="h-4 w-4" />,
    };
    return icons[action] || <Activity className="h-4 w-4" />;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      view: "Visualizzazione",
      click: "Click",
      scroll: "Scroll",
      addToCart: "Aggiunto al carrello",
      removeFromCart: "Rimosso dal carrello",
      checkout: "Checkout",
    };
    return labels[action] || action;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attività Clienti
            </CardTitle>
            <CardDescription>
              {connected ? (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Monitoraggio in tempo reale
                </span>
              ) : connecting ? (
                <span className="text-yellow-600">Connessione...</span>
              ) : (
                <span className="text-red-600">Disconnesso</span>
              )}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Users className="h-5 w-5 mr-2" />
            {onlineCustomers.size} online
          </Badge>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setView("visitors")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              view === "visitors"
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Visitatori Online
          </button>
          <button
            onClick={() => setView("activity")}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              view === "activity"
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Attività Recente
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {view === "visitors" ? (
            onlineCustomersArray.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Users className="h-16 w-16 mb-4 opacity-20" />
                <p>Nessun visitatore online</p>
              </div>
            ) : (
              <div className="space-y-3">
                {onlineCustomersArray.map((customer) => (
                  <div
                    key={customer.sessionId}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Users className="h-5 w-5 text-blue-500" />
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {customer.email || "Visitatore Anonimo"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {customer.customerId.slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(customer.lastActivity), {
                          addSuffix: true,
                          locale: it,
                        })}
                      </span>
                    </div>

                    {customer.currentPage && (
                      <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
                        <Eye className="h-4 w-4 inline mr-1 text-blue-600" />
                        <span className="text-blue-700">{customer.currentPage}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        <span>{customer.activityCount} azioni</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">
                          Sessione: {customer.sessionId.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <Activity className="h-16 w-16 mb-4 opacity-20" />
              <p>Nessuna attività recente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActionIcon(activity.action)}
                      <div>
                        <p className="text-sm font-medium">
                          {getActionLabel(activity.action)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.email || `Cliente ${activity.customerId.slice(0, 8)}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: it,
                      })}
                    </span>
                  </div>
                  {activity.page && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {activity.page}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
