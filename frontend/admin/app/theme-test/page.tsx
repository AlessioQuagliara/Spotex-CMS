'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/providers/theme-provider'

export default function ThemeTestPage() {
  const { theme, effectiveTheme, setTheme } = useTheme()

  const colors = [
    { name: 'Primary', class: 'bg-primary text-primary-foreground' },
    { name: 'Secondary', class: 'bg-secondary text-secondary-foreground' },
    { name: 'Accent', class: 'bg-accent text-accent-foreground' },
    { name: 'Muted', class: 'bg-muted text-muted-foreground' },
    { name: 'Destructive', class: 'bg-destructive text-destructive-foreground' },
    { name: 'Card', class: 'bg-card text-card-foreground border' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sistema di Temi</h1>
          <p className="text-muted-foreground">
            Tema attuale: <span className="font-semibold">{effectiveTheme}</span>
            {theme === 'system' && ' (da preferenza di sistema)'}
          </p>
        </div>

        {/* Theme Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Seleziona Tema</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'default' : 'outline'}
                onClick={() => setTheme(t)}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Palette Colori (WCAG AA)</CardTitle>
            <CardDescription>
              Tutti i colori rispettano i contrasti accessibili secondo WCAG AA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colors.map((color) => (
                <div
                  key={color.name}
                  className={`p-6 rounded-lg ${color.class} transition-all`}
                >
                  <p className="font-semibold text-sm">{color.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Components Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Pulsanti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badge</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Elementi di Forma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="input">Input</Label>
                <Input id="input" placeholder="Scrivi qualcosa..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textarea">Textarea</Label>
                <Textarea
                  id="textarea"
                  placeholder="Scrivi un messaggio più lungo..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WCAG Info */}
        <Card className="mt-8 bg-muted">
          <CardHeader>
            <CardTitle>Conformità Accessibilità</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>WCAG AA</strong>: Tutti i colori hanno un rapporto di contrasto
                minimo di 4.5:1 per il testo
              </li>
              <li>
                <strong>Dark Mode</strong>: Completamente supportato con transizioni
                fluide
              </li>
              <li>
                <strong>Preferenze di Sistema</strong>: Il tema può adattarsi alle
                preferenze di sistema dell&apos;utente
              </li>
              <li>
                <strong>Persistenza</strong>: La scelta del tema viene salvata in
                localStorage
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
