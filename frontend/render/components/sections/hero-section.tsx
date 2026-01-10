"use client";

import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  settings: {
    title?: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundImage?: string;
    alignment?: "left" | "center" | "right";
    overlay?: boolean;
    overlayOpacity?: number;
  };
}

export function HeroSection({ settings }: HeroSectionProps) {
  const { theme } = useTheme();
  
  const {
    title = "Benvenuto nel nostro Store",
    subtitle = "Scopri i nostri prodotti",
    description = "La migliore selezione di prodotti di qualità",
    buttonText = "Scopri di più",
    buttonLink = "/products",
    backgroundImage,
    alignment = "center",
    overlay = true,
    overlayOpacity = 0.5,
  } = settings;

  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <section
      className="relative min-h-[600px] flex items-center justify-center"
      style={{
        backgroundColor: theme.colors.muted,
      }}
    >
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${backgroundImage})`,
            }}
          />
          {overlay && (
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: overlayOpacity }}
            />
          )}
        </>
      )}

      <div className="relative z-10 container mx-auto px-4">
        <div className={`flex flex-col gap-6 max-w-3xl mx-auto ${alignmentClasses[alignment]}`}>
          {subtitle && (
            <p
              className="text-sm font-semibold uppercase tracking-wider"
              style={{
                color: backgroundImage ? "#ffffff" : theme.colors.primary,
              }}
            >
              {subtitle}
            </p>
          )}
          
          <h1
            className="font-bold leading-tight"
            style={{
              fontFamily: theme.typography.fontFamily.heading,
              fontSize: theme.typography.fontSize["5xl"],
              color: backgroundImage ? "#ffffff" : theme.colors.foreground,
            }}
          >
            {title}
          </h1>

          {description && (
            <p
              className="text-lg"
              style={{
                color: backgroundImage ? "#e5e5e5" : theme.colors.mutedForeground,
                lineHeight: theme.typography.lineHeight.relaxed,
              }}
            >
              {description}
            </p>
          )}

          {buttonText && (
            <div>
              <Button
                size="lg"
                onClick={() => (window.location.href = buttonLink)}
                style={{
                  backgroundColor: theme.colors.primary,
                  color: "#ffffff",
                  borderRadius: theme.borderRadius.md,
                }}
              >
                {buttonText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
