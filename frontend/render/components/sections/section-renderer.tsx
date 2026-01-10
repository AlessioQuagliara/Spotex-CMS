"use client";

import { SectionConfig } from "@/lib/theme/types";
import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { ProductsSection } from "./products-section";
import { CTASection } from "./cta-section";

interface SectionRendererProps {
  section: SectionConfig;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  if (!section.enabled) {
    return null;
  }

  switch (section.type) {
    case "hero":
      return <HeroSection settings={section.settings} />;
    case "features":
      return <FeaturesSection settings={section.settings} />;
    case "products":
      return <ProductsSection settings={section.settings} />;
    case "cta":
      return <CTASection settings={section.settings} />;
    default:
      return null;
  }
}
