"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SortableList } from "@/components/drag-drop/sortable-list";
import { ImageReorder } from "@/components/drag-drop/image-reorder";
import { FileUploadZone } from "@/components/drag-drop/file-upload-zone";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: number;
  name: string;
  productCount: number;
  order: number;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export default function DragDropDemoPage() {
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Elettronica", productCount: 45, order: 1 },
    { id: 2, name: "Abbigliamento", productCount: 123, order: 2 },
    { id: 3, name: "Casa & Cucina", productCount: 78, order: 3 },
    { id: 4, name: "Sport & Outdoor", productCount: 56, order: 4 },
    { id: 5, name: "Libri", productCount: 234, order: 5 },
  ]);

  const [images, setImages] = useState<ProductImage[]>([
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      alt: "Product 1",
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      alt: "Product 2",
    },
    {
      id: "3",
      url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      alt: "Product 3",
    },
    {
      id: "4",
      url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400",
      alt: "Product 4",
    },
  ]);

  const handleCategoriesReorder = (newCategories: Category[]) => {
    setCategories(newCategories);
    console.log("Nuovo ordine categorie:", newCategories.map((c) => c.name));
  };

  const handleImagesReorder = (newImages: ProductImage[]) => {
    setImages(newImages);
    console.log("Nuovo ordine immagini:", newImages.map((img) => img.id));
  };

  const handleImageRemove = (id: string | number) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    console.log("Immagine rimossa:", id);
  };

  const handleFilesSelected = (files: File[]) => {
    console.log("File selezionati:", files);
    // In a real app, upload files to server and add to images array
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Drag & Drop Demo</h1>
        <p className="text-muted-foreground mt-1">
          Esempi di componenti drag & drop per riordinare elementi e caricare file
        </p>
      </div>

      <div className="grid gap-6">
        {/* Sortable List */}
        <Card>
          <CardHeader>
            <CardTitle>Riordina Categorie</CardTitle>
            <p className="text-sm text-muted-foreground">
              Trascina le categorie per riordinarle
            </p>
          </CardHeader>
          <CardContent>
            <SortableList
              items={categories}
              onReorder={handleCategoriesReorder}
              getItemId={(item) => item.id}
              renderItem={(category) => (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.productCount} prodotti
                    </p>
                  </div>
                  <Badge variant="outline">Ordine: {category.order}</Badge>
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Image Reorder */}
        <Card>
          <CardHeader>
            <CardTitle>Riordina Immagini Prodotto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Trascina le immagini per cambiare l'ordine. La prima immagine sarà
              l'immagine principale.
            </p>
          </CardHeader>
          <CardContent>
            <ImageReorder
              images={images}
              onReorder={handleImagesReorder}
              onRemove={handleImageRemove}
            />
          </CardContent>
        </Card>

        {/* File Upload Zone */}
        <Card>
          <CardHeader>
            <CardTitle>Carica Immagini</CardTitle>
            <p className="text-sm text-muted-foreground">
              Trascina i file nella zona di caricamento o clicca per selezionare
            </p>
          </CardHeader>
          <CardContent>
            <FileUploadZone
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              maxSize={5 * 1024 * 1024}
              accept={{
                "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
              }}
              multiple={true}
              showPreviews={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
