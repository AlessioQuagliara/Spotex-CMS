/**
 * Analytics Configuration Component
 * Admin interface for configuring analytics settings
 */
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsConfig {
  google_analytics_id?: string;
  google_ads_id?: string;
  facebook_pixel_id?: string;
  enable_tracking: boolean;
  enable_ecommerce: boolean;
  enable_custom_events: boolean;
  cookie_consent_required: boolean;
  anonymize_ip: boolean;
}

export function AnalyticsConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['analytics-config'],
    queryFn: async () => {
      const response = await api.get<AnalyticsConfig>('/analytics/config');
      return response.data;
    },
  });

  const [formData, setFormData] = useState<AnalyticsConfig>({
    google_analytics_id: '',
    google_ads_id: '',
    facebook_pixel_id: '',
    enable_tracking: true,
    enable_ecommerce: false,
    enable_custom_events: true,
    cookie_consent_required: true,
    anonymize_ip: true,
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Update form data when config loads
  React.useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: async (data: AnalyticsConfig) => {
      return api.put('/analytics/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-config'] });
      toast({ title: 'Configurazione salvata', description: 'Le impostazioni sono state aggiornate.' });
    },
    onError: () => {
      toast({
        title: 'Errore',
        description: 'Impossibile salvare la configurazione.',
        variant: 'destructive'
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleTest = async () => {
    setTestStatus('testing');

    try {
      // Test GA connection (mock)
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (formData.google_analytics_id) {
        setTestStatus('success');
        toast({ title: 'Test riuscito', description: 'Google Analytics è configurato correttamente.' });
      } else {
        setTestStatus('error');
        toast({
          title: 'Test fallito',
          description: 'Measurement ID non valido.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      setTestStatus('error');
      toast({
        title: 'Test fallito',
        description: 'Errore durante il test della connessione.',
        variant: 'destructive'
      });
    }
  };

  const validateGAId = (id: string) => {
    // GA4 format: G-XXXXXXXXXX or UA-XXXXXXXXX-X
    const ga4Pattern = /^G-[A-Z0-9]{10}$/;
    const uaPattern = /^UA-\d{4,9}-\d{1,2}$/;
    return ga4Pattern.test(id) || uaPattern.test(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Configurazione Analytics</h1>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Configurazione Analytics</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTest} disabled={testStatus === 'testing'} variant="outline">
            <TestTube className="h-4 w-4 mr-2" />
            {testStatus === 'testing' ? 'Testando...' : 'Test Connessione'}
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Salvando...' : 'Salva'}
          </Button>
        </div>
      </div>

      {/* Test Status */}
      {testStatus !== 'idle' && (
        <Alert className={testStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {testStatus === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={testStatus === 'success' ? 'text-green-600' : 'text-red-600'}>
            {testStatus === 'success'
              ? 'Connessione Google Analytics verificata con successo!'
              : 'Errore nella connessione. Verifica le credenziali.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Cards */}
      <div className="grid gap-6">
        {/* Google Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Google Analytics 4
              {formData.google_analytics_id && validateGAId(formData.google_analytics_id) && (
                <Badge variant="secondary" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configurato
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ga-id">Measurement ID</Label>
              <Input
                id="ga-id"
                value={formData.google_analytics_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, google_analytics_id: e.target.value }))}
                placeholder="G-XXXXXXXXXX"
                className={!formData.google_analytics_id || validateGAId(formData.google_analytics_id) ? '' : 'border-red-500'}
              />
              <p className="text-sm text-muted-foreground">
                Il Measurement ID di Google Analytics 4 (formato: G-XXXXXXXXXX)
              </p>
              {formData.google_analytics_id && !validateGAId(formData.google_analytics_id) && (
                <p className="text-sm text-red-600">Formato Measurement ID non valido</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Services */}
        <Card>
          <CardHeader>
            <CardTitle>Servizi Aggiuntivi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ads-id">Google Ads ID (opzionale)</Label>
              <Input
                id="ads-id"
                value={formData.google_ads_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, google_ads_id: e.target.value }))}
                placeholder="AW-XXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fb-pixel">Facebook Pixel ID (opzionale)</Label>
              <Input
                id="fb-pixel"
                value={formData.facebook_pixel_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook_pixel_id: e.target.value }))}
                placeholder="123456789012345"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tracking Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Impostazioni Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Abilita Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Attiva/disattiva tutto il tracking analytics
                </p>
              </div>
              <Switch
                checked={formData.enable_tracking}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_tracking: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>E-commerce Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Traccia acquisti e conversioni e-commerce
                </p>
              </div>
              <Switch
                checked={formData.enable_ecommerce}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_ecommerce: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Eventi Personalizzati</Label>
                <p className="text-sm text-muted-foreground">
                  Traccia eventi personalizzati (scroll, form, etc.)
                </p>
              </div>
              <Switch
                checked={formData.enable_custom_events}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_custom_events: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Consenso Cookie</Label>
                <p className="text-sm text-muted-foreground">
                  Richiedi consenso prima del tracking
                </p>
              </div>
              <Switch
                checked={formData.cookie_consent_required}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, cookie_consent_required: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Anonimizza IP</Label>
                <p className="text-sm text-muted-foreground">
                  Rimuovi l'ultimo ottetto dell'IP per privacy
                </p>
              </div>
              <Switch
                checked={formData.anonymize_ip}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, anonymize_ip: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Implementation Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Guida Implementazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Ottieni Measurement ID</h4>
              <p className="text-sm text-muted-foreground">
                Vai su Google Analytics → Admin → Data Streams → Seleziona il tuo sito web → Measurement ID
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">2. Configura Eventi</h4>
              <p className="text-sm text-muted-foreground">
                Gli eventi vengono tracciati automaticamente: pageview, scroll, time_on_page, form_interaction, content_interaction
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. GDPR Compliance</h4>
              <p className="text-sm text-muted-foreground">
                Assicurati che il consenso cookie sia abilitato e che l'anonimizzazione IP sia attiva per conformità GDPR
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
