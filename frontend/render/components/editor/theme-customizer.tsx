"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ThemeCustomizer() {
  const { theme, setTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState(theme);

  const updateColor = (key: string, value: string) => {
    setLocalTheme({
      ...localTheme,
      colors: {
        ...localTheme.colors,
        [key]: value,
      },
    });
  };

  const updateTypography = (category: string, key: string, value: any) => {
    setLocalTheme({
      ...localTheme,
      typography: {
        ...localTheme.typography,
        [category]: {
          ...localTheme.typography[category as keyof typeof localTheme.typography],
          [key]: value,
        },
      },
    });
  };

  const applyChanges = () => {
    setTheme(localTheme);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Personalizza Tema</h2>
        <p className="text-muted-foreground">
          Modifica i colori, la tipografia e lo stile del tuo store
        </p>
      </div>

      <Tabs defaultValue="colors">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors">Colori</TabsTrigger>
          <TabsTrigger value="typography">Tipografia</TabsTrigger>
          <TabsTrigger value="spacing">Spaziatura</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schema Colori</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(localTheme.colors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-40 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                  <Input
                    type="color"
                    value={value}
                    onChange={(e) => updateColor(key, e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => updateColor(key, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Font</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Font Titoli</Label>
                <Select
                  value={localTheme.typography.fontFamily.heading}
                  onValueChange={(value) =>
                    updateTypography("fontFamily", "heading", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                    <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                    <SelectItem value="'Playfair Display', serif">
                      Playfair Display
                    </SelectItem>
                    <SelectItem value="'Montserrat', sans-serif">
                      Montserrat
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Font Testo</Label>
                <Select
                  value={localTheme.typography.fontFamily.body}
                  onValueChange={(value) =>
                    updateTypography("fontFamily", "body", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                    <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                    <SelectItem value="'Open Sans', sans-serif">
                      Open Sans
                    </SelectItem>
                    <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dimensioni Font</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(localTheme.typography.fontSize).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-24 text-sm">{key}</Label>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      updateTypography("fontSize", key, e.target.value)
                    }
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-16">
                    {value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spacing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spaziatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(localTheme.spacing).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-24">{key}</Label>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setLocalTheme({
                        ...localTheme,
                        spacing: {
                          ...localTheme.spacing,
                          [key]: e.target.value,
                        },
                      })
                    }
                    className="flex-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Border Radius</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(localTheme.borderRadius).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-24">{key}</Label>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setLocalTheme({
                        ...localTheme,
                        borderRadius: {
                          ...localTheme.borderRadius,
                          [key]: e.target.value,
                        },
                      })
                    }
                    className="flex-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline" onClick={() => setLocalTheme(theme)}>
          Reset
        </Button>
        <Button onClick={applyChanges}>Applica Modifiche</Button>
      </div>
    </div>
  );
}
