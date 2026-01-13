/**
 * Cohort Analysis Component
 * Analisi coorte per retention e lifetime value
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CohortData {
  cohort: string;
  size: number;
  retention: number[];
  revenue: number[];
  ltv: number;
}

export function CohortAnalysis() {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metric, setMetric] = useState<'retention' | 'revenue'>('retention');

  useEffect(() => {
    fetchCohortData();
  }, []);

  const fetchCohortData = async () => {
    try {
      const response = await fetch('/api/analytics/cohorts');
      const data = await response.json();

      setCohorts(data.cohorts);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch cohort data:', error);
    }
  };

  const getColor = (value: number, max: number): string => {
    const intensity = value / max;
    
    if (metric === 'retention') {
      // Green scale for retention
      return `rgba(34, 197, 94, ${intensity})`;
    } else {
      // Blue scale for revenue
      return `rgba(59, 130, 246, ${intensity})`;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
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

  const maxValue = Math.max(
    ...cohorts.flatMap((c) =>
      metric === 'retention' ? c.retention : c.revenue
    )
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Analisi Coorte</CardTitle>
            <CardDescription>
              Retention e performance nel tempo per gruppo di acquisizione
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMetric('retention')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                metric === 'retention'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Retention
            </button>
            <button
              onClick={() => setMetric('revenue')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                metric === 'revenue'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Ricavi
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 border-b font-semibold">Coorte</th>
                <th className="text-right p-2 border-b font-semibold">Utenti</th>
                {[...Array(12)].map((_, i) => (
                  <th key={i} className="text-center p-2 border-b font-semibold text-sm">
                    Mese {i}
                  </th>
                ))}
                <th className="text-right p-2 border-b font-semibold">LTV</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => {
                const values = metric === 'retention' ? cohort.retention : cohort.revenue;

                return (
                  <tr key={cohort.cohort} className="hover:bg-muted/50">
                    <td className="p-2 border-b font-medium">{cohort.cohort}</td>
                    <td className="text-right p-2 border-b">
                      {formatNumber(cohort.size)}
                    </td>
                    {values.map((value, index) => (
                      <td
                        key={index}
                        className="text-center p-2 border-b text-sm font-medium"
                        style={{
                          backgroundColor: getColor(value, maxValue),
                          color: value / maxValue > 0.5 ? 'white' : 'inherit',
                        }}
                      >
                        {metric === 'retention'
                          ? `${value.toFixed(0)}%`
                          : formatCurrency(value)}
                      </td>
                    ))}
                    <td className="text-right p-2 border-b font-bold">
                      {formatCurrency(cohort.ltv)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {cohorts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nessun dato di coorte disponibile
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Legenda</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Colori più intensi</p>
              <p>Indicano {metric === 'retention' ? 'retention più alta' : 'ricavi maggiori'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">LTV (Lifetime Value)</p>
              <p>Valore totale generato dalla coorte</p>
            </div>
          </div>
        </div>

        {/* Insights */}
        {cohorts.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Retention Media</p>
              <p className="text-2xl font-bold">
                {(
                  cohorts.reduce((sum, c) => sum + c.retention[0], 0) /
                  cohorts.length
                ).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">LTV Medio</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  cohorts.reduce((sum, c) => sum + c.ltv, 0) / cohorts.length
                )}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Corti Totali</p>
              <p className="text-2xl font-bold">{cohorts.length}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
