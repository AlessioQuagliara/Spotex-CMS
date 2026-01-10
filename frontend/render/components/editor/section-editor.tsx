"use client";

import { useState } from "react";
import { SectionConfig } from "@/lib/theme/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Eye, EyeOff, Settings, Trash2 } from "lucide-react";

interface SectionEditorProps {
  section: SectionConfig;
  onUpdate: (section: SectionConfig) => void;
  onDelete: (sectionId: string) => void;
  onToggleVisibility: (sectionId: string) => void;
}

export function SectionEditor({
  section,
  onUpdate,
  onDelete,
  onToggleVisibility,
}: SectionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = (key: string, value: any) => {
    onUpdate({
      ...section,
      settings: {
        ...section.settings,
        [key]: value,
      },
    });
  };

  const renderSettingsFields = () => {
    switch (section.type) {
      case "hero":
        return (
          <>
            <div className="space-y-2">
              <Label>Titolo</Label>
              <Input
                value={section.settings.title || ""}
                onChange={(e) => updateSetting("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sottotitolo</Label>
              <Input
                value={section.settings.subtitle || ""}
                onChange={(e) => updateSetting("subtitle", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={section.settings.description || ""}
                onChange={(e) => updateSetting("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Testo Pulsante</Label>
              <Input
                value={section.settings.buttonText || ""}
                onChange={(e) => updateSetting("buttonText", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Link Pulsante</Label>
              <Input
                value={section.settings.buttonLink || ""}
                onChange={(e) => updateSetting("buttonLink", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Immagine di Sfondo (URL)</Label>
              <Input
                value={section.settings.backgroundImage || ""}
                onChange={(e) => updateSetting("backgroundImage", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Allineamento</Label>
              <Select
                value={section.settings.alignment || "center"}
                onValueChange={(value) => updateSetting("alignment", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Sinistra</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Destra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "cta":
        return (
          <>
            <div className="space-y-2">
              <Label>Titolo</Label>
              <Input
                value={section.settings.title || ""}
                onChange={(e) => updateSetting("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={section.settings.description || ""}
                onChange={(e) => updateSetting("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Pulsante Primario</Label>
              <Input
                value={section.settings.primaryButtonText || ""}
                onChange={(e) => updateSetting("primaryButtonText", e.target.value)}
                placeholder="Testo"
              />
              <Input
                value={section.settings.primaryButtonLink || ""}
                onChange={(e) => updateSetting("primaryButtonLink", e.target.value)}
                placeholder="Link"
                className="mt-2"
              />
            </div>
            <div className="space-y-2">
              <Label>Pulsante Secondario</Label>
              <Input
                value={section.settings.secondaryButtonText || ""}
                onChange={(e) => updateSetting("secondaryButtonText", e.target.value)}
                placeholder="Testo"
              />
              <Input
                value={section.settings.secondaryButtonLink || ""}
                onChange={(e) => updateSetting("secondaryButtonLink", e.target.value)}
                placeholder="Link"
                className="mt-2"
              />
            </div>
          </>
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">
            Editor specifico non disponibile per questo tipo di sezione
          </p>
        );
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
          <h3 className="font-semibold capitalize">{section.type}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility(section.id)}
          >
            {section.enabled ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(section.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {renderSettingsFields()}
        </div>
      )}
    </div>
  );
}
