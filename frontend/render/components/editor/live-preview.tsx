"use client";

import { useState } from "react";
import { PageTemplate } from "@/lib/theme/types";
import { PageTemplateRenderer } from "../template/page-template";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LivePreviewProps {
  template: PageTemplate;
  isEditing?: boolean;
}

type DeviceType = "desktop" | "tablet" | "mobile";

export function LivePreview({ template, isEditing = false }: LivePreviewProps) {
  const [device, setDevice] = useState<DeviceType>("desktop");

  const deviceSizes = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  };

  const deviceHeights = {
    desktop: "h-full",
    tablet: "h-[1024px]",
    mobile: "h-[667px]",
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Device Selector */}
      <div className="border-b p-4 bg-background flex items-center justify-center gap-2">
        <Button
          variant={device === "desktop" ? "default" : "outline"}
          size="sm"
          onClick={() => setDevice("desktop")}
        >
          <Monitor className="h-4 w-4 mr-2" />
          Desktop
        </Button>
        <Button
          variant={device === "tablet" ? "default" : "outline"}
          size="sm"
          onClick={() => setDevice("tablet")}
        >
          <Tablet className="h-4 w-4 mr-2" />
          Tablet
        </Button>
        <Button
          variant={device === "mobile" ? "default" : "outline"}
          size="sm"
          onClick={() => setDevice("mobile")}
        >
          <Smartphone className="h-4 w-4 mr-2" />
          Mobile
        </Button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
        <div
          className={cn(
            "bg-background shadow-2xl transition-all duration-300 overflow-hidden",
            deviceSizes[device],
            device !== "desktop" && deviceHeights[device],
            device !== "desktop" && "border rounded-lg"
          )}
        >
          <div className="h-full overflow-y-auto">
            {isEditing && (
              <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-sm text-yellow-800">
                <strong>Modalità Preview:</strong> Questa è un'anteprima del tuo tema.
                Le modifiche non sono ancora pubblicate.
              </div>
            )}
            <PageTemplateRenderer template={template} />
          </div>
        </div>
      </div>
    </div>
  );
}
