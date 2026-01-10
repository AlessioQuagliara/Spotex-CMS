/**
 * SEO Editor Component
 * Form for editing SEO meta tags
 */
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SEOEditorProps {
  title?: string;
  description?: string;
  keywords?: string;
  slug?: string;
  onChange: (field: string, value: string) => void;
}

export function SEOEditor({ title = '', description = '', keywords = '', slug = '', onChange }: SEOEditorProps) {
  const [titleLength, setTitleLength] = useState(title.length);
  const [descLength, setDescLength] = useState(description.length);
  const [validation, setValidation] = useState<{ warnings: string[]; errors: string[] }>({
    warnings: [],
    errors: [],
  });

  useEffect(() => {
    setTitleLength(title.length);
    validateSEO();
  }, [title]);

  useEffect(() => {
    setDescLength(description.length);
    validateSEO();
  }, [description]);

  const validateSEO = () => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Title validation
    if (!title) {
      errors.push('Meta title obbligatorio');
    } else if (titleLength > 60) {
      warnings.push(`Title troppo lungo (${titleLength} caratteri, consigliato: 50-60)`);
    } else if (titleLength < 30) {
      warnings.push(`Title troppo corto (${titleLength} caratteri, consigliato: 50-60)`);
    }

    // Description validation
    if (!description) {
      errors.push('Meta description obbligatoria');
    } else if (descLength > 160) {
      warnings.push(`Description troppo lunga (${descLength} caratteri, consigliato: 150-160)`);
    } else if (descLength < 120) {
      warnings.push(`Description troppo corta (${descLength} caratteri, consigliato: 150-160)`);
    }

    // Keywords validation
    if (keywords) {
      const keywordCount = keywords.split(',').length;
      if (keywordCount > 10) {
        warnings.push(`Troppe keywords (${keywordCount}, consigliato: 5-10)`);
      }
    }

    setValidation({ warnings, errors });
  };

  const getTitleColor = () => {
    if (titleLength === 0) return 'text-muted-foreground';
    if (titleLength > 60) return 'text-destructive';
    if (titleLength < 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getDescColor = () => {
    if (descLength === 0) return 'text-muted-foreground';
    if (descLength > 160) return 'text-destructive';
    if (descLength < 120) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Ottimizzazione SEO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Alerts */}
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validation.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation.warnings.length > 0 && validation.errors.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validation.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation.errors.length === 0 && validation.warnings.length === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              SEO ottimizzato correttamente
            </AlertDescription>
          </Alert>
        )}

        {/* SEO Title */}
        <div className="space-y-2">
          <Label htmlFor="seo-title">
            Meta Title
            <span className={`ml-2 text-sm ${getTitleColor()}`}>
              {titleLength}/60 caratteri
            </span>
          </Label>
          <Input
            id="seo-title"
            value={title}
            onChange={(e) => onChange('seo_title', e.target.value)}
            placeholder="Titolo ottimizzato per i motori di ricerca"
            maxLength={70}
          />
          <p className="text-xs text-muted-foreground">
            Apparirà nei risultati di ricerca. Ottimale: 50-60 caratteri.
          </p>
        </div>

        {/* SEO Description */}
        <div className="space-y-2">
          <Label htmlFor="seo-description">
            Meta Description
            <span className={`ml-2 text-sm ${getDescColor()}`}>
              {descLength}/160 caratteri
            </span>
          </Label>
          <textarea
            id="seo-description"
            value={description}
            onChange={(e) => onChange('seo_description', e.target.value)}
            placeholder="Descrizione breve e accattivante del contenuto"
            className="w-full min-h-[80px] px-3 py-2 border rounded-md"
            maxLength={170}
          />
          <p className="text-xs text-muted-foreground">
            Apparirà sotto il titolo nei risultati di ricerca. Ottimale: 150-160 caratteri.
          </p>
        </div>

        {/* SEO Keywords */}
        <div className="space-y-2">
          <Label htmlFor="seo-keywords">
            Keywords
            <span className="ml-2 text-xs text-muted-foreground">
              ({keywords ? keywords.split(',').length : 0} keywords)
            </span>
          </Label>
          <Input
            id="seo-keywords"
            value={keywords}
            onChange={(e) => onChange('seo_keywords', e.target.value)}
            placeholder="keyword1, keyword2, keyword3"
          />
          <p className="text-xs text-muted-foreground">
            Separa le keywords con virgole. Consigliato: 5-10 keywords.
          </p>
          {keywords && (
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.split(',').map((kw, i) => (
                <Badge key={i} variant="secondary">
                  {kw.trim()}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* URL Slug */}
        <div className="space-y-2">
          <Label htmlFor="seo-slug">URL Slug</Label>
          <Input
            id="seo-slug"
            value={slug}
            onChange={(e) => onChange('slug', e.target.value)}
            placeholder="url-ottimizzato-seo"
          />
          <p className="text-xs text-muted-foreground">
            URL leggibile e ottimizzato: usa trattini, evita caratteri speciali.
          </p>
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            Preview: <span className="font-mono">/blog/{slug || 'url-slug'}</span>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2 pt-4 border-t">
          <Label>Anteprima Google</Label>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium line-clamp-1">
              {title || 'Titolo del contenuto'}
            </div>
            <div className="text-xs text-green-700 mt-1">
              example.com › blog › {slug || 'url-slug'}
            </div>
            <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {description || 'Descrizione del contenuto che apparirà nei risultati di ricerca...'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
