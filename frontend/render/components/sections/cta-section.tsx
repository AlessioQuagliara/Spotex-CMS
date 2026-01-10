"use client";

import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  settings: {
    title?: string;
    description?: string;
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    backgroundColor?: string;
    backgroundImage?: string;
  };
}

export function CTASection({ settings }: CTASectionProps) {
  const { theme } = useTheme();
  
  const {
    title = "Pronto per iniziare?",
    description = "Unisciti a migliaia di clienti soddisfatti",
    primaryButtonText = "Inizia Ora",
    primaryButtonLink = "/register",
    secondaryButtonText = "Scopri di più",
    secondaryButtonLink = "/about",
    backgroundColor,
    backgroundImage,
  } = settings;

  return (
    <section
      className="relative py-20"
      style={{
        backgroundColor: backgroundColor || theme.colors.primary,
      }}
    >
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-black opacity-50" />
        </>
      )}

      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="font-bold mb-4"
            style={{
              fontFamily: theme.typography.fontFamily.heading,
              fontSize: theme.typography.fontSize["4xl"],
              color: "#ffffff",
            }}
          >
            {title}
          </h2>

          <p
            className="mb-8"
            style={{
              fontSize: theme.typography.fontSize.lg,
              color: "#e5e5e5",
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {primaryButtonText && (
              <Button
                size="lg"
                onClick={() => (window.location.href = primaryButtonLink)}
                style={{
                  backgroundColor: "#ffffff",
                  color: theme.colors.primary,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                {primaryButtonText}
              </Button>
            )}

            {secondaryButtonText && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => (window.location.href = secondaryButtonLink)}
                style={{
                  borderColor: "#ffffff",
                  color: "#ffffff",
                  borderRadius: theme.borderRadius.md,
                }}
              >
                {secondaryButtonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
