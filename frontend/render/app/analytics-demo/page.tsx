/**
 * Analytics Demo Page
 * Showcase analytics features and tracking
 */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/components/analytics/analytics-provider';
import { useFormTracking, useContentTracking, useSearchTracking } from '@/lib/analytics';
import { trackError, trackPerformance } from '@/lib/analytics';
import {
  BarChart3,
  Search,
  FileText,
  Share2,
  Download,
  Send,
  AlertTriangle,
  Zap,
  MousePointer,
  Eye,
} from 'lucide-react';

export default function AnalyticsDemoPage() {
  const { trackEvent } = useAnalytics();
  const [searchTerm, setSearchTerm] = useState('');
  const [customEventName, setCustomEventName] = useState('');
  const [customEventParams, setCustomEventParams] = useState('{}');

  // Form tracking
  const { trackFormStart, trackFormComplete } = useFormTracking('demo-form');

  // Content tracking
  const { trackView, trackShare, trackDownload } = useContentTracking('demo', 'analytics-demo');

  // Search tracking
  const trackSearch = useSearchTracking();

  const handleCustomEvent = () => {
    try {
      const params = JSON.parse(customEventParams);
      trackEvent(customEventName, params);
      alert(`Evento "${customEventName}" inviato!`);
    } catch (error) {
      alert('Errore nel formato JSON dei parametri');
    }
  };

  const handleSearch = () => {
    if (searchTerm) {
      trackSearch(searchTerm, Math.floor(Math.random() * 100));
      alert(`Ricerca tracciata: "${searchTerm}"`);
    }
  };

  const handleErrorDemo = () => {
    try {
      throw new Error('Demo error for analytics tracking');
    } catch (error) {
      trackError(error as Error, 'demo');
      alert('Errore tracciato negli analytics!');
    }
  };

  const handlePerformanceDemo = () => {
    const startTime = performance.now();
    // Simulate some work
    setTimeout(() => {
      const endTime = performance.now();
      trackPerformance('demo_operation', endTime - startTime);
      alert(`Performance tracciato: ${(endTime - startTime).toFixed(2)}ms`);
    }, 100);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Analytics Demo</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Esplora le funzionalità di tracking e analytics integrate
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">Google Analytics 4</Badge>
            <Badge variant="secondary">Event Tracking</Badge>
            <Badge variant="secondary">Performance Monitoring</Badge>
            <Badge variant="secondary">Error Tracking</Badge>
          </div>
        </div>

        {/* Automatic Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Tracking Automatico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Questi eventi vengono tracciati automaticamente senza intervento manuale:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Page Views</h4>
                <p className="text-sm text-muted-foreground">
                  Ogni cambio di pagina viene tracciato automaticamente
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Scroll Depth</h4>
                <p className="text-sm text-muted-foreground">
                  Traccia quanto gli utenti scorrono la pagina (25%, 50%, 75%, 90%)
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Time on Page</h4>
                <p className="text-sm text-muted-foreground">
                  Misura il tempo trascorso su ogni pagina
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">User Engagement</h4>
                <p className="text-sm text-muted-foreground">
                  Traccia interazioni utente (click, hover, focus)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Event Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Tracking Eventi Manuale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Custom Event */}
            <div className="space-y-4">
              <h4 className="font-medium">Evento Personalizzato</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Nome evento (es: button_click)"
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                />
                <Input
                  placeholder='Parametri JSON (es: {"category": "demo"})'
                  value={customEventParams}
                  onChange={(e) => setCustomEventParams(e.target.value)}
                />
              </div>
              <Button onClick={handleCustomEvent} disabled={!customEventName}>
                <Send className="h-4 w-4 mr-2" />
                Invia Evento
              </Button>
            </div>

            {/* Search Tracking */}
            <div className="space-y-4">
              <h4 className="font-medium">Tracking Ricerca</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Cerca qualcosa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={!searchTerm}>
                  <Search className="h-4 w-4 mr-2" />
                  Cerca
                </Button>
              </div>
            </div>

            {/* Content Interaction */}
            <div className="space-y-4">
              <h4 className="font-medium">Interazione Contenuto</h4>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={trackView} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Vista Contenuto
                </Button>
                <Button onClick={trackShare} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Condividi
                </Button>
                <Button onClick={trackDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Form Tracking */}
            <div className="space-y-4">
              <h4 className="font-medium">Tracking Form</h4>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={trackFormStart} variant="outline">
                  Inizia Form
                </Button>
                <Button onClick={trackFormComplete} variant="outline">
                  Completa Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error & Performance Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error & Performance Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground mb-4">
              Traccia errori JavaScript e metriche di performance:
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleErrorDemo} variant="destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Simula Errore
              </Button>
              <Button onClick={handlePerformanceDemo} variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Misura Performance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Informazioni Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Eventi Automatici</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• page_view - Cambio pagina</li>
                  <li>• scroll - Profondità scroll</li>
                  <li>• time_on_page - Tempo su pagina</li>
                  <li>• engagement - Interazioni utente</li>
                  <li>• form_interaction - Moduli</li>
                  <li>• content_interaction - Contenuto</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Eventi Personalizzati</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• search - Ricerche</li>
                  <li>• share - Condivisioni</li>
                  <li>• download - Download</li>
                  <li>• purchase - Acquisti</li>
                  <li>• conversion - Conversioni</li>
                  <li>• error - Errori</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Note Implementazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Privacy & GDPR</h4>
                <p className="text-muted-foreground">
                  L'anonimizzazione IP è abilitata per default. Il consenso cookie può essere richiesto prima del tracking.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Performance</h4>
                <p className="text-muted-foreground">
                  Gli eventi vengono inviati in background per non bloccare l'interfaccia utente.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Debug</h4>
                <p className="text-muted-foreground">
                  In modalità debug, tutti gli eventi vengono loggati nella console del browser.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
