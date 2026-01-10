"use client";

import { useState } from "react";
import { PageTemplate, SectionConfig, ThemeConfig } from "@/lib/theme/types";
import { ThemeBuilder } from "./theme-builder";
import { LivePreview } from "./live-preview";
import { ThemeCustomizer } from "./theme-customizer";
import { CodeEditor } from "./code-editor";
import { ThemeVersioning, ThemeVersion } from "./theme-versioning";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Layout,
  Palette,
  Code,
  Clock,
  Eye,
  EyeOff,
  Save,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ThemeEditorWorkspace() {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState("builder");

  const [currentTemplate, setCurrentTemplate] = useState<PageTemplate>({
    id: "home",
    name: "Homepage",
    type: "home",
    sections: [],
    seo: {
      title: "Store - Homepage",
      description: "Benvenuto nel nostro store",
    },
  });

  const [customCss, setCustomCss] = useState("");
  const [customJs, setCustomJs] = useState("");

  const [versions, setVersions] = useState<ThemeVersion[]>([
    {
      id: "v1",
      version: "1.0.0",
      name: "Initial Theme",
      description: "Versione iniziale del tema",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      createdBy: "Admin",
      status: "published",
    },
    {
      id: "v2",
      version: "1.1.0",
      name: "Updated Hero",
      description: "Aggiornata sezione hero con nuovo design",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdBy: "Admin",
      status: "draft",
      changes: ["Hero section redesign", "New color scheme"],
    },
  ]);

  const handleSectionsChange = (sections: SectionConfig[]) => {
    setCurrentTemplate({
      ...currentTemplate,
      sections,
    });
  };

  const handleSaveTheme = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Tema Salvato",
        description: "Le modifiche sono state salvate con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare il tema",
        variant: "destructive",
      });
    }
  };

  const handlePublishTheme = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Tema Pubblicato",
        description: "Il tema è ora live sul tuo store",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile pubblicare il tema",
        variant: "destructive",
      });
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    toast({
      title: "Versione Ripristinata",
      description: `Tema ripristinato alla versione ${versionId}`,
    });
  };

  const handlePreviewVersion = (versionId: string) => {
    toast({
      title: "Anteprima Versione",
      description: `Visualizzazione versione ${versionId}`,
    });
  };

  const handleDeleteVersion = (versionId: string) => {
    setVersions(versions.filter((v) => v.id !== versionId));
    toast({
      title: "Versione Eliminata",
      description: "La versione è stata rimossa",
    });
  };

  const handlePublishVersion = (versionId: string) => {
    setVersions(
      versions.map((v) =>
        v.id === versionId ? { ...v, status: "published" as const } : v
      )
    );
    toast({
      title: "Versione Pubblicata",
      description: "La versione è ora attiva",
    });
  };

  const handleSaveNewVersion = () => {
    const newVersion: ThemeVersion = {
      id: `v${versions.length + 1}`,
      version: `1.${versions.length}.0`,
      name: `Version ${versions.length + 1}`,
      description: "Nuova versione salvata",
      createdAt: new Date(),
      createdBy: "Admin",
      status: "draft",
    };
    setVersions([newVersion, ...versions]);
    
    toast({
      title: "Nuova Versione Creata",
      description: `Versione ${newVersion.version} salvata`,
    });
  };

  const handleDownloadVersion = (versionId: string) => {
    toast({
      title: "Download Avviato",
      description: "Il file verrà scaricato a breve",
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Theme Editor</h1>
            <p className="text-sm text-muted-foreground">
              Personalizza il design del tuo store
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Nascondi Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mostra Preview
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleSaveTheme}>
              <Save className="h-4 w-4 mr-2" />
              Salva
            </Button>
            <Button onClick={handlePublishTheme}>
              <Upload className="h-4 w-4 mr-2" />
              Pubblica
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Editor */}
        <div className={showPreview ? "w-1/2 border-r" : "w-full"}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b p-0">
              <TabsTrigger value="builder" className="rounded-none">
                <Layout className="h-4 w-4 mr-2" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="theme" className="rounded-none">
                <Palette className="h-4 w-4 mr-2" />
                Tema
              </TabsTrigger>
              <TabsTrigger value="code" className="rounded-none">
                <Code className="h-4 w-4 mr-2" />
                Codice
              </TabsTrigger>
              <TabsTrigger value="versions" className="rounded-none">
                <Clock className="h-4 w-4 mr-2" />
                Versioni
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="builder" className="h-full m-0">
                <ThemeBuilder
                  sections={currentTemplate.sections}
                  onSectionsChange={handleSectionsChange}
                  onSave={handleSaveTheme}
                  onPreview={() => setShowPreview(true)}
                />
              </TabsContent>

              <TabsContent value="theme" className="h-full m-0 overflow-auto">
                <ThemeCustomizer />
              </TabsContent>

              <TabsContent value="code" className="h-full m-0">
                <CodeEditor
                  css={customCss}
                  js={customJs}
                  onCssChange={setCustomCss}
                  onJsChange={setCustomJs}
                  onApply={() => {
                    toast({
                      title: "Codice Applicato",
                      description: "Il codice personalizzato è stato applicato",
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="versions" className="h-full m-0">
                <ThemeVersioning
                  versions={versions}
                  currentVersionId="v1"
                  onRestore={handleRestoreVersion}
                  onPreview={handlePreviewVersion}
                  onDelete={handleDeleteVersion}
                  onPublish={handlePublishVersion}
                  onSaveNew={handleSaveNewVersion}
                  onDownload={handleDownloadVersion}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Panel - Live Preview */}
        {showPreview && (
          <div className="w-1/2">
            <LivePreview template={currentTemplate} isEditing={true} />
          </div>
        )}
      </div>
    </div>
  );
}
