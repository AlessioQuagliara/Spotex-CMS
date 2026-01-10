"use client";

import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  slug: string;
}

interface ProductsSectionProps {
  settings: {
    title?: string;
    subtitle?: string;
    products?: Product[];
    showPrice?: boolean;
    columns?: 3 | 4;
    buttonText?: string;
  };
}

export function ProductsSection({ settings }: ProductsSectionProps) {
  const { theme } = useTheme();
  
  const {
    title = "Prodotti in Evidenza",
    subtitle = "Scopri i nostri best seller",
    products = [],
    showPrice = true,
    columns = 4,
    buttonText = "Vedi Prodotto",
  } = settings;

  const gridCols = {
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(price);
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

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: theme.colors.mutedForeground }}>
              Nessun prodotto disponibile
            </p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols[columns]} gap-6`}>
            {products.map((product) => (
              <div
                key={product.id}
                className="group overflow-hidden transition-shadow hover:shadow-lg"
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.borderRadius.lg,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                </div>
                
                <div className="p-4">
                  <h3
                    className="font-semibold mb-2 line-clamp-2"
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.foreground,
                    }}
                  >
                    {product.name}
                  </h3>
                  
                  {showPrice && (
                    <p
                      className="font-bold mb-4"
                      style={{
                        fontSize: theme.typography.fontSize.lg,
                        color: theme.colors.primary,
                      }}
                    >
                      {formatPrice(product.price)}
                    </p>
                  )}

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => (window.location.href = `/products/${product.slug}`)}
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: "#ffffff",
                      borderRadius: theme.borderRadius.md,
                    }}
                  >
                    {buttonText}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
