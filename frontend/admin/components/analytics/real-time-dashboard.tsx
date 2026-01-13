/**
 * Real-Time Dashboard Component
 * Dashboard con metriche real-time e visualizzazioni
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Eye,
  DollarSign,
  Activity
} from 'lucide-react';

interface RealTimeMetrics {
  activeUsers: number;
  pageViews: number;
  conversions: number;
  revenue: number;
  cartAdditions: number;
  bounceRate: number;
}

interface TopPage {
  path: string;
  views: number;
  avgTime: number;
}

export function RealTimeDashboard() {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeUsers: 0,
    pageViews: 0,
    conversions: 0,
    revenue: 0,
    cartAdditions: 0,
    bounceRate: 0,
  });

  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRealTimeData();

    // Update every 5 seconds
    const interval = setInterval(fetchRealTimeData, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch('/api/analytics/realtime');
      const data = await response.json();

      setMetrics(data.metrics);
      setTopPages(data.topPages);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch real-time data:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('it-IT').format(value);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Real-Time</h2>
          <p className="text-muted-foreground">
            Metriche aggiornate ogni 5 secondi
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 animate-pulse text-green-500" />
          <span>Live</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Active Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Attivi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.activeUsers)}</div>
            <p className="text-xs text-muted-foreground">
              Visitatori online ora
            </p>
          </CardContent>
        </Card>

        {/* Page Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizzazioni</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.pageViews)}</div>
            <p className="text-xs text-muted-foreground">
              Pagine viste oggi
            </p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ricavi</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              Vendite oggi
            </p>
          </CardContent>
        </Card>

        {/* Conversions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversioni</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.conversions)}</div>
            <p className="text-xs text-muted-foreground">
              Ordini completati
            </p>
          </CardContent>
        </Card>

        {/* Cart Additions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carrelli</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.cartAdditions)}</div>
            <p className="text-xs text-muted-foreground">
              Prodotti aggiunti
            </p>
          </CardContent>
        </Card>

        {/* Bounce Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.bounceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Visitatori rimbalzati
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Pagine Più Visitate</CardTitle>
          <CardDescription>
            Le pagine con più traffico in questo momento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPages.map((page, index) => (
              <div key={page.path} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{page.path}</p>
                    <p className="text-sm text-muted-foreground">
                      Tempo medio: {formatDuration(page.avgTime)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatNumber(page.views)}</p>
                  <p className="text-sm text-muted-foreground">visualizzazioni</p>
                </div>
              </div>
            ))}

            {topPages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
