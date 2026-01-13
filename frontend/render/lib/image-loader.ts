/**
 * Custom Image Loader for CDN
 * Handles image optimization via CDN
 */

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cdnLoader({ src, width, quality }: ImageLoaderProps): string {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || "";
  
  if (!cdnUrl) {
    return src;
  }
  
  // Handle external URLs
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  
  // Build CDN URL with optimization parameters
  const params = new URLSearchParams();
  params.set("w", width.toString());
  params.set("q", (quality || 75).toString());
  params.set("fm", "webp"); // Prefer WebP format
  
  // Remove leading slash from src
  const cleanSrc = src.startsWith("/") ? src.substring(1) : src;
  
  return `${cdnUrl}/${cleanSrc}?${params.toString()}`;
}
