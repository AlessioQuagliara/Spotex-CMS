"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Code, FileCode } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CodeEditorProps {
  css?: string;
  js?: string;
  onCssChange?: (css: string) => void;
  onJsChange?: (js: string) => void;
  onApply?: () => void;
}

export function CodeEditor({
  css = "",
  js = "",
  onCssChange,
  onJsChange,
  onApply,
}: CodeEditorProps) {
  const [localCss, setLocalCss] = useState(css);
  const [localJs, setLocalJs] = useState(js);
  const [cssError, setCssError] = useState<string | null>(null);
  const [jsError, setJsError] = useState<string | null>(null);

  const validateCss = (code: string) => {
    try {
      // Basic CSS validation
      if (code.includes("<script")) {
        throw new Error("Script tags non consentiti nel CSS");
      }
      setCssError(null);
      return true;
    } catch (error) {
      setCssError(error instanceof Error ? error.message : "Errore CSS");
      return false;
    }
  };

  const validateJs = (code: string) => {
    try {
      // Basic JS validation
      if (code.includes("eval(") || code.includes("Function(")) {
        throw new Error("eval() e Function() non sono consentiti");
      }
      new Function(code); // Test syntax
      setJsError(null);
      return true;
    } catch (error) {
      setJsError(error instanceof Error ? error.message : "Errore JavaScript");
      return false;
    }
  };

  const handleCssChange = (value: string) => {
    setLocalCss(value);
    validateCss(value);
    onCssChange?.(value);
  };

  const handleJsChange = (value: string) => {
    setLocalJs(value);
    validateJs(value);
    onJsChange?.(value);
  };

  const handleApply = () => {
    const cssValid = validateCss(localCss);
    const jsValid = validateJs(localJs);
    
    if (cssValid && jsValid) {
      onApply?.();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Editor Codice Personalizzato</h2>
          <Button onClick={handleApply} disabled={!!cssError || !!jsError}>
            <Code className="h-4 w-4 mr-2" />
            Applica Modifiche
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="css" className="h-full flex flex-col">
          <TabsList className="m-4 mb-0">
            <TabsTrigger value="css">
              <FileCode className="h-4 w-4 mr-2" />
              Custom CSS
            </TabsTrigger>
            <TabsTrigger value="js">
              <Code className="h-4 w-4 mr-2" />
              Custom JavaScript
            </TabsTrigger>
          </TabsList>

          <TabsContent value="css" className="flex-1 p-4 pt-2 overflow-auto">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">CSS Personalizzato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Aggiungi il tuo CSS personalizzato per sovrascrivere gli stili del tema
                  </Label>
                  <Textarea
                    value={localCss}
                    onChange={(e) => handleCssChange(e.target.value)}
                    placeholder="/* Inserisci il tuo CSS qui */&#10;.custom-class {&#10;  color: #333;&#10;  font-size: 16px;&#10;}"
                    className="font-mono text-sm h-[400px] resize-none"
                  />
                </div>

                {cssError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{cssError}</AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Suggerimento:</strong> Usa le variabili CSS del tema come
                    <code className="mx-1 px-1 bg-muted rounded">var(--color-primary)</code>,
                    <code className="mx-1 px-1 bg-muted rounded">var(--font-heading)</code>, ecc.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="js" className="flex-1 p-4 pt-2 overflow-auto">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">JavaScript Personalizzato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Aggiungi funzionalità personalizzate con JavaScript
                  </Label>
                  <Textarea
                    value={localJs}
                    onChange={(e) => handleJsChange(e.target.value)}
                    placeholder="// Inserisci il tuo JavaScript qui&#10;document.addEventListener('DOMContentLoaded', function() {&#10;  console.log('Custom JS loaded');&#10;});"
                    className="font-mono text-sm h-[400px] resize-none"
                  />
                </div>

                {jsError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{jsError}</AlertDescription>
                  </Alert>
                )}

                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Attenzione:</strong> Per motivi di sicurezza, alcune funzioni
                    come <code>eval()</code> e <code>Function()</code> sono disabilitate.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Suggerimento:</strong> Il codice verrà eseguito dopo il caricamento
                    completo della pagina. Usa <code>window</code> e <code>document</code> per
                    interagire con il DOM.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
