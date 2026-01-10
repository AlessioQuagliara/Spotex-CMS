"use client";

import { Suspense, lazy } from "react";
import { useLazyLoad } from "@/hooks/use-lazy-load";
import { Skeleton } from "@/components/ui/skeleton";

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazySection({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = "100px",
  className,
}: LazySectionProps) {
  const { ref, isVisible } = useLazyLoad({ threshold, rootMargin });

  return (
    <div ref={ref as any} className={className}>
      {isVisible ? (
        children
      ) : (
        fallback || (
          <div className="w-full space-y-4 p-8">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )
      )}
    </div>
  );
}

// Component wrapper for dynamic imports
export function withLazyLoad<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyLoadedComponent(props: P) {
    return (
      <Suspense
        fallback={
          fallback || (
            <div className="w-full space-y-4 p-8">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          )
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
