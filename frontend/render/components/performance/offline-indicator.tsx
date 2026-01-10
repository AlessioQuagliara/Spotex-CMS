"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showToast) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
        isOnline
          ? "bg-green-500 text-white"
          : "bg-red-500 text-white"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-5 w-5" />
          <span className="font-medium">Connessione ripristinata</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5" />
          <span className="font-medium">Modalità offline</span>
        </>
      )}
    </div>
  );
}
