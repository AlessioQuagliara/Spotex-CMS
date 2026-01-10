"use client";

import { useEffect } from "react";
import { PageTemplate } from "@/lib/theme/types";
import { useTheme } from "@/contexts/theme-context";
import { SectionRenderer } from "../sections/section-renderer";

interface PageTemplateRendererProps {
  template: PageTemplate;
}

export function PageTemplateRenderer({ template }: PageTemplateRendererProps) {
  const { setCurrentTemplate } = useTheme();

  useEffect(() => {
    setCurrentTemplate(template);
    
    // Set SEO meta tags
    if (template.seo.title) {
      document.title = template.seo.title;
    }
    
    if (template.seo.description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute("content", template.seo.description);
    }
  }, [template, setCurrentTemplate]);

  // Sort sections by order
  const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="page-template">
      {sortedSections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
