/**
 * Translation Management Component
 * Admin interface for managing UI translations
 */
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Download, Upload, Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Translation {
  id: number;
  key: string;
  value: string;
  language_code: string;
  namespace: string;
}

export function TranslationManager() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [selectedNamespace, setSelectedNamespace] = useState('common');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Fetch translations
  const { data: translations, isLoading } = useQuery({
    queryKey: ['translations', selectedLanguage, selectedNamespace],
    queryFn: async () => {
      const response = await api.get('/i18n/translations', {
        params: {
          language_code: selectedLanguage,
          namespace: selectedNamespace,
        },
      });
      return response.data;
    },
  });

  // Create translation
  const createMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      return api.post('/i18n/translations', {
        key: data.key,
        language_code: selectedLanguage,
        value: data.value,
        namespace: selectedNamespace,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      toast({ title: 'Translation created' });
      setNewKey('');
      setNewValue('');
    },
  });

  // Update translation
  const updateMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      return api.put(`/i18n/translations/${data.key}`, {
        language_code: selectedLanguage,
        value: data.value,
        namespace: selectedNamespace,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      toast({ title: 'Translation updated' });
      setEditingKey(null);
    },
  });

  // Export translations
  const handleExport = async () => {
    try {
      const response = await api.get('/i18n/translations/export', {
        params: { language_code: selectedLanguage, namespace: selectedNamespace },
      });
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedLanguage}-${selectedNamespace}.json`;
      a.click();
      
      toast({ title: 'Translations exported' });
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  // Import translations
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      await api.post('/i18n/translations/import', {
        language_code: selectedLanguage,
        namespace: selectedNamespace,
        translations: data,
      });
      
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      toast({ title: 'Translations imported' });
    } catch (error) {
      toast({ title: 'Import failed', variant: 'destructive' });
    }
  };

  const namespaces = ['common', 'auth', 'admin', 'posts', 'errors'];
  const languages = ['en', 'it', 'es', 'fr', 'de', 'ar', 'he'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Translation Management</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <label>
              <Upload className="w-4 h-4 mr-2" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Language</Label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Namespace</Label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {namespaces.map((ns) => (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Add new translation */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Add New Translation</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Key</Label>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="common.welcome"
            />
          </div>
          <div>
            <Label>Value</Label>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Welcome"
            />
          </div>
        </div>
        <Button
          onClick={() => createMutation.mutate({ key: newKey, value: newValue })}
          disabled={!newKey || !newValue}
          className="mt-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Translation
        </Button>
      </Card>

      {/* Translations list */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Translations</h3>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-2">
            {translations?.items?.map((translation: Translation) => (
              <div key={translation.id} className="flex items-center gap-4 p-3 border rounded">
                <div className="flex-1">
                  <div className="font-mono text-sm text-muted-foreground">
                    {translation.key}
                  </div>
                  {editingKey === translation.key ? (
                    <Input
                      defaultValue={translation.value}
                      onBlur={(e) => {
                        updateMutation.mutate({
                          key: translation.key,
                          value: e.target.value,
                        });
                      }}
                      autoFocus
                    />
                  ) : (
                    <div className="mt-1">{translation.value}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingKey(translation.key)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
