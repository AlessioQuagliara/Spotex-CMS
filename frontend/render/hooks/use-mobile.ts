/**
 * Mobile Hooks and Utilities
 * Touch gestures, pull-to-refresh, camera, geolocation
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * ===================
 * TOUCH GESTURES
 * ===================
 */

export interface SwipeEvent {
  direction: "left" | "right" | "up" | "down";
  distance: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface UseSwipeOptions {
  onSwipe?: (event: SwipeEvent) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe
  timeout?: number; // Maximum time for swipe
}

export function useSwipe(options: UseSwipeOptions = {}) {
  const {
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    timeout = 300,
  } = options;
  
  const startPos = useRef({ x: 0, y: 0, time: 0 });
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);
  
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();
      
      const deltaX = endX - startPos.current.x;
      const deltaY = endY - startPos.current.y;
      const duration = endTime - startPos.current.time;
      
      // Check if it's a valid swipe
      if (duration > timeout) return;
      
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (Math.max(absX, absY) < threshold) return;
      
      // Determine direction
      let direction: SwipeEvent["direction"];
      
      if (absX > absY) {
        direction = deltaX > 0 ? "right" : "left";
      } else {
        direction = deltaY > 0 ? "down" : "up";
      }
      
      const swipeEvent: SwipeEvent = {
        direction,
        distance: Math.max(absX, absY),
        duration,
        startX: startPos.current.x,
        startY: startPos.current.y,
        endX,
        endY,
      };
      
      // Call callbacks
      onSwipe?.(swipeEvent);
      
      switch (direction) {
        case "left":
          onSwipeLeft?.();
          break;
        case "right":
          onSwipeRight?.();
          break;
        case "up":
          onSwipeUp?.();
          break;
        case "down":
          onSwipeDown?.();
          break;
      }
    },
    [onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, timeout]
  );
  
  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

/**
 * ===================
 * PULL TO REFRESH
 * ===================
 */

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export function usePullToRefresh(options: UsePullToRefreshOptions) {
  const { onRefresh, threshold = 80, resistance = 2.5 } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow pull to refresh from top of page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);
  
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);
      
      // Apply resistance
      const adjustedDistance = distance / resistance;
      
      setPullDistance(adjustedDistance);
      
      // Prevent default scroll if pulling
      if (distance > 0) {
        e.preventDefault();
      }
    },
    [isRefreshing, resistance]
  );
  
  const handleTouchEnd = useCallback(async () => {
    isPulling.current = false;
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);
  
  return {
    isRefreshing,
    pullDistance,
    isPulling: isPulling.current,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

/**
 * ===================
 * CAMERA ACCESS
 * ===================
 */

export interface CameraOptions {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
}

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const startCamera = useCallback(async (options: CameraOptions = {}) => {
    const { facingMode = "environment", width = 1920, height = 1080 } = options;
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
      });
      
      setStream(mediaStream);
      setIsActive(true);
      setError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      return mediaStream;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error("[Camera] Failed to access camera:", error);
      throw error;
    }
  }, []);
  
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsActive(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);
  
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !stream) {
      throw new Error("Camera not active");
    }
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }
    
    ctx.drawImage(videoRef.current, 0, 0);
    
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to capture photo"));
          }
        },
        "image/jpeg",
        0.95
      );
    });
  }, [stream]);
  
  const switchCamera = useCallback(async () => {
    const currentFacingMode = stream
      ?.getVideoTracks()[0]
      .getSettings().facingMode;
    
    stopCamera();
    
    const newFacingMode =
      currentFacingMode === "user" ? "environment" : "user";
    
    await startCamera({ facingMode: newFacingMode });
  }, [stream, stopCamera, startCamera]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
  return {
    stream,
    error,
    isActive,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
  };
}

/**
 * ===================
 * GEOLOCATION
 * ===================
 */

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;
  
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    loading: false,
  });
  
  const watchIdRef = useRef<number | null>(null);
  
  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
      error: null,
      loading: false,
    });
  }, []);
  
  const updateError = useCallback((error: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      error,
      loading: false,
    }));
  }, []);
  
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      updateError({
        code: 0,
        message: "Geolocation not supported",
      } as GeolocationPositionError);
      return;
    }
    
    setState((prev) => ({ ...prev, loading: true }));
    
    navigator.geolocation.getCurrentPosition(updatePosition, updateError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, updateError]);
  
  useEffect(() => {
    if (!watch) {
      getCurrentPosition();
      return;
    }
    
    if (!navigator.geolocation) {
      updateError({
        code: 0,
        message: "Geolocation not supported",
      } as GeolocationPositionError);
      return;
    }
    
    setState((prev) => ({ ...prev, loading: true }));
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      updatePosition,
      updateError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [watch, enableHighAccuracy, timeout, maximumAge, updatePosition, updateError]);
  
  return {
    ...state,
    getCurrentPosition,
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * ===================
 * VIBRATION
 * ===================
 */

export function vibrate(pattern: number | number[]): boolean {
  if (!navigator.vibrate) {
    console.warn("[Vibration] API not supported");
    return false;
  }
  
  return navigator.vibrate(pattern);
}

/**
 * Haptic feedback patterns
 */
export const HapticPatterns = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [30, 100, 30, 100, 30],
  click: 5,
  doubleClick: [5, 50, 5],
};
