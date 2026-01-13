/**
 * Cookie Consent Banner
 * Banner GDPR per gestione consensi cookie
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Settings } from 'lucide-react';
import { consentManager } from '@/shared/lib/analytics';
import type { ConsentStatus } from '@/shared/lib/analytics';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<ConsentStatus>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
    timestamp: Date.now(),
  });

  useEffect(() => {
    // Check if consent was already given
    const hasConsent = consentManager.hasConsentBeenGiven();
    
    if (!hasConsent) {
      // Show banner after 1 second
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    consentManager.acceptAll();
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    consentManager.rejectAll();
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    consentManager.updateConsent(consent);
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <Card className="max-w-2xl w-full pointer-events-auto shadow-2xl">
        <CardHeader className="relative">
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Chiudi</span>
          </button>
          <CardTitle>Questo sito utilizza i cookie</CardTitle>
          <CardDescription>
            Utilizziamo i cookie per migliorare la tua esperienza sul nostro sito.
            Puoi accettare tutti i cookie o personalizzare le tue preferenze.
          </CardDescription>
        </CardHeader>

        {!showSettings ? (
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
              Accetta Tutti
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Rifiuta Tutti
            </Button>
            <Button
              onClick={() => setShowSettings(true)}
              variant="ghost"
              className="w-full sm:w-auto"
            >
              <Settings className="mr-2 h-4 w-4" />
              Personalizza
            </Button>
          </CardFooter>
        ) : (
          <>
            <CardContent className="space-y-4">
              {/* Necessary Cookies */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label>Cookie Necessari</Label>
                  <p className="text-sm text-muted-foreground">
                    Essenziali per il funzionamento del sito. Non possono essere disabilitati.
                  </p>
                </div>
                <Switch checked disabled />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="analytics">Cookie Analitici</Label>
                  <p className="text-sm text-muted-foreground">
                    Ci aiutano a capire come i visitatori interagiscono con il sito.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={consent.analytics}
                  onCheckedChange={(checked) =>
                    setConsent({ ...consent, analytics: checked })
                  }
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="marketing">Cookie Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Utilizzati per mostrare pubblicità rilevante per te.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={consent.marketing}
                  onCheckedChange={(checked) =>
                    setConsent({ ...consent, marketing: checked })
                  }
                />
              </div>

              {/* Preference Cookies */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="preferences">Cookie Preferenze</Label>
                  <p className="text-sm text-muted-foreground">
                    Memorizzano le tue preferenze sul sito.
                  </p>
                </div>
                <Switch
                  id="preferences"
                  checked={consent.preferences}
                  onCheckedChange={(checked) =>
                    setConsent({ ...consent, preferences: checked })
                  }
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSavePreferences} className="w-full sm:w-auto">
                Salva Preferenze
              </Button>
              <Button
                onClick={() => setShowSettings(false)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Indietro
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
