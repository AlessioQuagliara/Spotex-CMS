/**
 * Media Uploader Component
 * Upload multiplo immagini con preview
 */

'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon, Star } from 'lucide-react'
import Image from 'next/image'

interface MediaFile {
  id: string
  url: string
  alt: string
  position: number
  featured: boolean
}

interface MediaUploaderProps {
  images: MediaFile[]
  onChange: (images: MediaFile[]) => void
}

export function MediaUploader({ images, onChange }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const newImages: MediaFile[] = Array.from(files).map((file, index) => ({
        id: Date.now().toString() + index,
        url: URL.createObjectURL(file),
        alt: file.name.replace(/\.[^/.]+$/, ''),
        position: images.length + index,
        featured: images.length === 0 && index === 0,
      }))

      onChange([...images, ...newImages])
    },
    [images, onChange]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleRemove = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id)
    
    // If removed image was featured, make first image featured
    if (updatedImages.length > 0 && !updatedImages.some((img) => img.featured)) {
      updatedImages[0].featured = true
    }

    onChange(updatedImages)
  }

  const handleSetFeatured = (id: string) => {
    onChange(
      images.map((img) => ({
        ...img,
        featured: img.id === id,
      }))
    )
  }

  const handleAltChange = (id: string, alt: string) => {
    onChange(
      images.map((img) => (img.id === id ? { ...img, alt } : img))
    )
  }

  const handleReorder = (dragIndex: number, hoverIndex: number) => {
    const dragImage = images[dragIndex]
    const newImages = [...images]
    newImages.splice(dragIndex, 1)
    newImages.splice(hoverIndex, 0, dragImage)

    onChange(
      newImages.map((img, index) => ({
        ...img,
        position: index,
      }))
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media</CardTitle>
        <CardDescription>
          Upload product images (drag to reorder, first image is featured)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Drop images here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
              <Button type="button" variant="outline" size="sm">
                Select Files
              </Button>
            </div>
          </label>
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images
              .sort((a, b) => a.position - b.position)
              .map((image, index) => (
                <div
                  key={image.id}
                  className="relative group border rounded-lg overflow-hidden bg-muted"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/html', index.toString())
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const dragIndex = parseInt(e.dataTransfer.getData('text/html'))
                    handleReorder(dragIndex, index)
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover"
                    />

                    {/* Featured Badge */}
                    {image.featured && (
                      <div className="absolute top-2 left-2">
                        <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Featured
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!image.featured && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSetFeatured(image.id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(image.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Alt Text */}
                  <div className="p-2">
                    <input
                      type="text"
                      value={image.alt}
                      onChange={(e) => handleAltChange(image.id, e.target.value)}
                      placeholder="Alt text"
                      className="w-full text-xs px-2 py-1 border rounded"
                    />
                  </div>
                </div>
              ))}
          </div>
        )}

        {images.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No images uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
