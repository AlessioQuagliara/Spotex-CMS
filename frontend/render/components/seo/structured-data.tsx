/**
 * Structured Data Component
 * Renders JSON-LD structured data for SEO
 */
import { StructuredData } from '@/lib/seo';

interface StructuredDataProps {
  data: StructuredData | StructuredData[];
}

export function StructuredDataComponent({ data }: StructuredDataProps) {
  const dataArray = Array.isArray(data) ? data : [data];

  return (
    <>
      {dataArray.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
