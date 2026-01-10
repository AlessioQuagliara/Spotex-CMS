"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  className?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 75,
  className,
  objectFit = "cover",
  placeholder = "blur",
  blurDataURL,
  sizes,
  loading = "lazy",
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate low-quality placeholder
  const defaultBlurDataURL =
    blurDataURL ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E";

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const imageProps = {
    src,
    alt,
    quality,
    priority,
    loading: priority ? undefined : loading,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      "transition-opacity duration-300",
      isLoaded ? "opacity-100" : "opacity-0",
      className
    ),
    ...(placeholder === "blur" && { blurDataURL: defaultBlurDataURL }),
    ...(sizes && { sizes }),
  };

  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
        style={{ objectFit }}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Image
      {...imageProps}
      width={width!}
      height={height!}
      style={{ objectFit }}
      placeholder={placeholder}
    />
  );
}

// Utility to generate srcSet for responsive images
export function generateSrcSet(src: string, widths: number[] = [320, 640, 1024, 1920]) {
  return widths.map((width) => `${src}?w=${width} ${width}w`).join(", ");
}

// Utility to generate sizes attribute
export function generateSizes(breakpoints: Record<string, string>) {
  return Object.entries(breakpoints)
    .map(([bp, size]) => `(${bp}) ${size}`)
    .join(", ");
}
