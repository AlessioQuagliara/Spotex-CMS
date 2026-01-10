"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageItem {
  id: string | number;
  url: string;
  alt?: string;
}

interface SortableImageProps {
  image: ImageItem;
  onRemove: (id: string | number) => void;
}

function SortableImage({ image, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group aspect-square rounded-lg border overflow-hidden bg-muted",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
    >
      <img
        src={image.url}
        alt={image.alt || "Product image"}
        className="w-full h-full object-cover"
      />
      
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none p-2 bg-white rounded-md hover:bg-gray-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => onRemove(image.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isDragging && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
          Trascina per riordinare
        </div>
      )}
    </div>
  );
}

interface ImageReorderProps {
  images: ImageItem[];
  onReorder: (images: ImageItem[]) => void;
  onRemove: (id: string | number) => void;
  className?: string;
}

export function ImageReorder({
  images,
  onReorder,
  onRemove,
  className,
}: ImageReorderProps) {
  const [localImages, setLocalImages] = useState(images);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localImages.findIndex((img) => img.id === active.id);
      const newIndex = localImages.findIndex((img) => img.id === over.id);

      const newImages = arrayMove(localImages, oldIndex, newIndex);
      setLocalImages(newImages);
      onReorder(newImages);
    }
  };

  if (localImages.length === 0) {
    return (
      <div className={cn("text-center p-8 border rounded-lg bg-muted", className)}>
        <p className="text-muted-foreground">Nessuna immagine caricata</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localImages.map((img) => img.id)} strategy={rectSortingStrategy}>
        <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
          {localImages.map((image) => (
            <SortableImage key={image.id} image={image} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
