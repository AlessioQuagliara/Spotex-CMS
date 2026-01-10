/**
 * Analytics Dashboard Component
 * Admin interface for analytics data
 */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  Users,
  Eye,
  TrendingUp,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AnalyticsData {
  period: string;
  total_visitors: number;
  total_pageviews: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  top_pages: Array<{
    page: string;
    views: number;
    bounce_rate: number;
  }>;
  top_referrers: Array<{
    referrer: string;
    visits: number;
  }>;
  device_breakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  geographic_data: Record<string, number>;
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['analytics-overview', period],
    queryFn: async () => {
      const response = await api.get<AnalyticsData>(`/analytics/reports/overview?days=${period}`);
      return response.data;
    },
  });

  const { data: content } = useQuery({
    queryKey: ['analytics-content', period],
    queryFn: async () => {
      const response = await api.get(`/analytics/reports/content?days=${period}`);
      return response.data;
    },
  });

  const { data: realtime } = useQuery({
    queryKey: ['analytics-realtime'],
    queryFn: async () => {
      const response = await api.get('/analytics/realtime');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-8 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 giorni</SelectItem>
              <SelectItem value="30">30 giorni</SelectItem>
              <SelectItem value="90">90 giorni</SelectItem>
              <SelectItem value="365">1 anno</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitatori Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.total_visitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% rispetto al periodo precedente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizzazioni Pagina</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.total_pageviews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8% rispetto al periodo precedente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitatori Unici</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.unique_visitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +15% rispetto al periodo precedente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Medio Sessione</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(overview?.avg_session_duration || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Bounce rate: {formatPercentage(overview?.bounce_rate || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="content">Contenuto</TabsTrigger>
          <TabsTrigger value="audience">Pubblico</TabsTrigger>
          <TabsTrigger value="realtime">Tempo Reale</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Pagine Più Visitate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview?.top_pages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{page.page}</p>
                        <p className="text-sm text-muted-foreground">
                          Bounce rate: {formatPercentage(page.bounce_rate)}
                        </p>
                      </div>
                      <Badge variant="secondary">{page.views.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Referrers */}
            <Card>
              <CardHeader>
                <CardTitle>Fonti di Traffico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview?.top_referrers.map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{referrer.referrer}</p>
                      </div>
                      <Badge variant="secondary">{referrer.visits.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Contenuto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {content?.content_performance.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.category} • {item.author} • {formatDate(item.published_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.views.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">visualizzazioni</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Dispositivi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>Desktop</span>
                    </div>
                    <Badge>{overview?.device_breakdown.desktop.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>Mobile</span>
                    </div>
                    <Badge>{overview?.device_breakdown.mobile.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tablet className="h-4 w-4" />
                      <span>Tablet</span>
                    </div>
                    <Badge>{overview?.device_breakdown.tablet.toLocaleString()}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Geographic Data */}
            <Card>
              <CardHeader>
                <CardTitle>Paesi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(overview?.geographic_data || {}).map(([country, visits]) => (
                    <div key={country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{country}</span>
                      </div>
                      <Badge>{visits.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utenti Attivi</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {realtime?.active_users || 0}
                </div>
                <p className="text-xs text-muted-foreground">in tempo reale</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eventi/Minuto</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {realtime?.events_per_minute || 0}
                </div>
                <p className="text-xs text-muted-foreground">media</p>
              </CardContent>
            </Card>
          </div>

          {/* Realtime Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Pagine Attive Ora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realtime?.current_pageviews.map((page: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{page.page}</span>
                    <Badge variant="secondary">{page.users} utenti</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
