"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SectionConfig, SectionType } from "@/lib/theme/types";
import { SectionEditor } from "./section-editor";
import { Button } from "@/components/ui/button";
import { Plus, Save, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ThemeBuilderProps {
  sections: SectionConfig[];
  onSectionsChange: (sections: SectionConfig[]) => void;
  onSave: () => void;
  onPreview: () => void;
}

export function ThemeBuilder({
  sections,
  onSectionsChange,
  onSave,
  onPreview,
}: ThemeBuilderProps) {
  const [selectedSectionType, setSelectedSectionType] = useState<SectionType>("hero");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          order: index,
        })
      );
      onSectionsChange(newSections);
    }
  };

  const addSection = () => {
    const newSection: SectionConfig = {
      id: `section-${Date.now()}`,
      type: selectedSectionType,
      order: sections.length,
      enabled: true,
      settings: {},
    };
    onSectionsChange([...sections, newSection]);
  };

  const updateSection = (updatedSection: SectionConfig) => {
    onSectionsChange(
      sections.map((s) => (s.id === updatedSection.id ? updatedSection : s))
    );
  };

  const deleteSection = (sectionId: string) => {
    onSectionsChange(
      sections
        .filter((s) => s.id !== sectionId)
        .map((s, index) => ({ ...s, order: index }))
    );
  };

  const toggleSectionVisibility = (sectionId: string) => {
    onSectionsChange(
      sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Theme Builder</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Salva
            </Button>
          </div>
        </div>

        {/* Add Section */}
        <div className="flex gap-2">
          <Select
            value={selectedSectionType}
            onValueChange={(value) => setSelectedSectionType(value as SectionType)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo sezione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero</SelectItem>
              <SelectItem value="features">Features</SelectItem>
              <SelectItem value="products">Prodotti</SelectItem>
              <SelectItem value="cta">Call to Action</SelectItem>
              <SelectItem value="testimonials">Testimonials</SelectItem>
              <SelectItem value="gallery">Gallery</SelectItem>
              <SelectItem value="content">Contenuto</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addSection}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Sezione
          </Button>
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nessuna sezione. Aggiungi la tua prima sezione per iniziare.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  onUpdate={updateSection}
                  onDelete={deleteSection}
                  onToggleVisibility={toggleSectionVisibility}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
