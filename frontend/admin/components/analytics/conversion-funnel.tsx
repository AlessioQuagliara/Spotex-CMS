/**
 * Conversion Funnel Component
 * Visualizzazione del funnel di conversione
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, TrendingDown, TrendingUp } from 'lucide-react';

interface FunnelStep {
  name: string;
  description: string;
  users: number;
  percentage: number;
  dropOffRate: number;
}

export function ConversionFunnel() {
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchFunnelData();
  }, [timeRange]);

  const fetchFunnelData = async () => {
    try {
      const response = await fetch(`/api/analytics/funnel?range=${timeRange}`);
      const data = await response.json();

      setFunnel(data.steps);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch funnel data:', error);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('it-IT').format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Funnel di Conversione</CardTitle>
            <CardDescription>
              Visualizza il percorso degli utenti verso la conversione
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {range === '7d' && '7 giorni'}
                {range === '30d' && '30 giorni'}
                {range === '90d' && '90 giorni'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {funnel.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === funnel.length - 1;
          const width = step.percentage;

          return (
            <div key={step.name} className="space-y-2">
              {/* Step Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{step.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatNumber(step.users)}</p>
                  <p className="text-sm text-muted-foreground">
                    {step.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 flex items-center justify-between px-4"
                  style={{ width: `${width}%` }}
                >
                  <span className="text-sm font-medium text-primary-foreground">
                    {formatNumber(step.users)} utenti
                  </span>
                  <span className="text-sm font-medium text-primary-foreground">
                    {step.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Drop-off Rate */}
              {!isLast && (
                <div className="flex items-center gap-2 text-sm">
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Drop-off: {step.dropOffRate.toFixed(1)}%
                  </span>
                  {step.dropOffRate > 50 ? (
                    <span className="flex items-center gap-1 text-red-500">
                      <TrendingDown className="h-3 w-3" />
                      Alto
                    </span>
                  ) : step.dropOffRate < 20 ? (
                    <span className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-3 w-3" />
                      Basso
                    </span>
                  ) : null}
                </div>
              )}

              {!isLast && <div className="h-px bg-border" />}
            </div>
          );
        })}

        {funnel.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nessun dato disponibile per il periodo selezionato
          </div>
        )}

        {/* Summary */}
        {funnel.length > 0 && (
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Riepilogo Conversione</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tasso di Conversione</p>
                <p className="text-lg font-bold">
                  {funnel[funnel.length - 1]?.percentage.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Utenti Iniziali</p>
                <p className="text-lg font-bold">
                  {formatNumber(funnel[0]?.users || 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Conversioni</p>
                <p className="text-lg font-bold">
                  {formatNumber(funnel[funnel.length - 1]?.users || 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
