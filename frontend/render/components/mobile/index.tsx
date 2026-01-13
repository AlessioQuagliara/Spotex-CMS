/**
 * Mobile UI Components
 * Pull-to-refresh, camera, image upload, store locator
 */

"use client";

import React, { useState } from "react";
import { usePullToRefresh, useCamera, useGeolocation, calculateDistance } from "@/hooks/use-mobile";
import { RefreshCw, Camera, X, FlipHorizontal, MapPin, Navigation } from "lucide-react";

/**
 * ===================
 * PULL TO REFRESH
 * ===================
 */

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const { isRefreshing, pullDistance, handlers } = usePullToRefresh({
    onRefresh,
    threshold,
  });
  
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const opacity = Math.min(pullDistance / threshold, 1);
  
  return (
    <div {...handlers} className="relative">
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center transition-all"
        style={{
          height: `${Math.min(pullDistance, threshold)}px`,
          opacity,
        }}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <RefreshCw
            className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: `rotate(${progress * 3.6}deg)`,
            }}
          />
          <span>
            {isRefreshing
              ? "Aggiornamento..."
              : pullDistance >= threshold
              ? "Rilascia per aggiornare"
              : "Tira per aggiornare"}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div
        className="transition-transform"
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * ===================
 * CAMERA COMPONENT
 * ===================
 */

export interface CameraComponentProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  facingMode?: "user" | "environment";
}

export function CameraComponent({
  onCapture,
  onClose,
  facingMode = "environment",
}: CameraComponentProps) {
  const { videoRef, isActive, error, startCamera, stopCamera, capturePhoto, switchCamera } =
    useCamera();
  const [isCapturing, setIsCapturing] = useState(false);
  
  React.useEffect(() => {
    startCamera({ facingMode });
    
    return () => {
      stopCamera();
    };
  }, []);
  
  const handleCapture = async () => {
    setIsCapturing(true);
    
    try {
      const blob = await capturePhoto();
      onCapture(blob);
      onClose();
    } catch (error) {
      console.error("Failed to capture photo:", error);
    } finally {
      setIsCapturing(false);
    }
  };
  
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="mb-4">Impossibile accedere alla fotocamera</p>
          <p className="text-sm text-gray-400">{error.message}</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-md bg-white px-4 py-2 text-black"
          >
            Chiudi
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />
      
      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-center justify-between">
          {/* Close button */}
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
          >
            <X className="h-6 w-6" />
          </button>
          
          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={!isActive || isCapturing}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 backdrop-blur-sm disabled:opacity-50"
          >
            {isCapturing ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            ) : (
              <Camera className="h-8 w-8 text-white" />
            )}
          </button>
          
          {/* Switch camera */}
          <button
            onClick={switchCamera}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
          >
            <FlipHorizontal className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ===================
 * IMAGE UPLOAD
 * ===================
 */

export interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  multiple?: boolean;
  maxSize?: number; // MB
  accept?: string;
  showCamera?: boolean;
}

export function ImageUpload({
  onUpload,
  multiple = false,
  maxSize = 5,
  accept = "image/*",
  showCamera = true,
}: ImageUploadProps) {
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file size
    const validFiles = files.filter((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} è troppo grande (max ${maxSize}MB)`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleCameraCapture = (blob: Blob) => {
    const file = new File([blob], `photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    
    onUpload([file]);
  };
  
  return (
    <>
      <div className="flex gap-2">
        {/* File input button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 rounded-md border-2 border-dashed border-gray-300 px-4 py-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div className="text-sm text-gray-600">
            <p className="font-medium">Carica immagine</p>
            <p className="mt-1 text-xs">Max {maxSize}MB</p>
          </div>
        </button>
        
        {/* Camera button */}
        {showCamera && (
          <button
            onClick={() => setShowCameraModal(true)}
            className="flex aspect-square w-24 flex-col items-center justify-center gap-2 rounded-md border-2 border-gray-300 transition-colors hover:border-primary hover:bg-primary/5"
          >
            <Camera className="h-6 w-6 text-gray-600" />
            <span className="text-xs text-gray-600">Fotocamera</span>
          </button>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Camera modal */}
      {showCameraModal && (
        <CameraComponent
          onCapture={handleCameraCapture}
          onClose={() => setShowCameraModal(false)}
        />
      )}
    </>
  );
}

/**
 * ===================
 * STORE LOCATOR
 * ===================
 */

export interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  hours?: string;
  distance?: number;
}

export interface StoreLocatorProps {
  stores: Store[];
  onStoreSelect?: (store: Store) => void;
}

export function StoreLocator({ stores, onStoreSelect }: StoreLocatorProps) {
  const { latitude, longitude, loading, error, getCurrentPosition } = useGeolocation({
    enableHighAccuracy: true,
  });
  
  // Calculate distances
  const storesWithDistance = React.useMemo(() => {
    if (!latitude || !longitude) return stores;
    
    return stores
      .map((store) => ({
        ...store,
        distance: calculateDistance(latitude, longitude, store.latitude, store.longitude),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [stores, latitude, longitude]);
  
  return (
    <div className="space-y-4">
      {/* Location button */}
      <button
        onClick={getCurrentPosition}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Ricerca posizione...</span>
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4" />
            <span>Usa la mia posizione</span>
          </>
        )}
      </button>
      
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error.message}
        </div>
      )}
      
      {/* Stores list */}
      <div className="space-y-3">
        {storesWithDistance.map((store) => (
          <button
            key={store.id}
            onClick={() => onStoreSelect?.(store)}
            className="w-full rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-primary hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{store.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{store.address}</p>
                
                {store.phone && (
                  <p className="mt-2 text-sm text-gray-500">{store.phone}</p>
                )}
                
                {store.hours && (
                  <p className="mt-1 text-xs text-gray-500">{store.hours}</p>
                )}
              </div>
              
              {store.distance !== undefined && (
                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                  <MapPin className="h-4 w-4" />
                  <span>{store.distance.toFixed(1)} km</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
