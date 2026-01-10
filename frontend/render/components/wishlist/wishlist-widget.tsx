"use client";

import { useWishlist } from "@/contexts/wishlist-context";
import { useLocalization } from "@/contexts/localization-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import Image from "next/image";

export function WishlistWidget() {
  const { items, removeItem } = useWishlist();
  const { t, formatPrice } = useLocalization();

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
        <h3 className="text-lg font-semibold mb-2">{t("wishlist.empty")}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t("wishlist.title")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="relative aspect-square mb-3">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <h3 className="font-semibold mb-2 line-clamp-2">{item.name}</h3>
              <p className="text-lg font-bold text-primary mb-3">
                {formatPrice(item.price)}
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t("product.addToCart")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
