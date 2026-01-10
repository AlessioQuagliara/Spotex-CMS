"use client";

import { useTheme } from "@/contexts/theme-context";
import { CheckCircle, Truck, Shield, CreditCard } from "lucide-react";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  settings: {
    title?: string;
    subtitle?: string;
    features?: Feature[];
    columns?: 2 | 3 | 4;
  };
}

const iconMap = {
  check: CheckCircle,
  truck: Truck,
  shield: Shield,
  card: CreditCard,
};

export function FeaturesSection({ settings }: FeaturesSectionProps) {
  const { theme } = useTheme();
  
  const {
    title = "Perché Sceglierci",
    subtitle = "I vantaggi di acquistare da noi",
    features = [
      {
        icon: "truck",
        title: "Spedizione Gratuita",
        description: "Spedizione gratuita per ordini superiori a €50",
      },
      {
        icon: "shield",
        title: "Pagamenti Sicuri",
        description: "Transazioni protette e sicure al 100%",
      },
      {
        icon: "card",
        title: "Reso Facile",
        description: "30 giorni per cambiare idea",
      },
      {
        icon: "check",
        title: "Garanzia Qualità",
        description: "Prodotti testati e certificati",
      },
    ],
    columns = 4,
  } = settings;

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return (
    <section
      className="py-20"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          {subtitle && (
            <p
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: theme.colors.primary }}
            >
              {subtitle}
            </p>
          )}
          <h2
            className="font-bold"
            style={{
              fontFamily: theme.typography.fontFamily.heading,
              fontSize: theme.typography.fontSize["3xl"],
              color: theme.colors.foreground,
            }}
          >
            {title}
          </h2>
        </div>

        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-8`}>
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap] || CheckCircle;
            
            return (
              <div
                key={index}
                className="text-center p-6 rounded-lg transition-transform hover:scale-105"
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.borderRadius.lg,
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                  style={{
                    backgroundColor: `${theme.colors.primary}15`,
                    color: theme.colors.primary,
                  }}
                >
                  <Icon className="w-8 h-8" />
                </div>
                
                <h3
                  className="font-semibold mb-2"
                  style={{
                    fontSize: theme.typography.fontSize.lg,
                    color: theme.colors.foreground,
                  }}
                >
                  {feature.title}
                </h3>
                
                <p
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.mutedForeground,
                    lineHeight: theme.typography.lineHeight.relaxed,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
