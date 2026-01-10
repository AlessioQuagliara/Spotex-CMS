"use client";

import { ConnectionStatus } from "@/hooks/use-realtime";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeIndicatorProps {
  status: ConnectionStatus;
  className?: string;
  showLabel?: boolean;
}

export function RealtimeIndicator({
  status,
  className,
  showLabel = false,
}: RealtimeIndicatorProps) {
  const getStatusInfo = () => {
    switch (status) {
      case "connecting":
        return {
          icon: Loader2,
          color: "text-yellow-500",
          bg: "bg-yellow-500/10",
          label: "Connessione...",
          animate: true,
        };
      case "connected":
        return {
          icon: Wifi,
          color: "text-green-500",
          bg: "bg-green-500/10",
          label: "Connesso",
          animate: false,
        };
      case "disconnected":
        return {
          icon: WifiOff,
          color: "text-gray-500",
          bg: "bg-gray-500/10",
          label: "Disconnesso",
          animate: false,
        };
      case "error":
        return {
          icon: WifiOff,
          color: "text-red-500",
          bg: "bg-red-500/10",
          label: "Errore",
          animate: false,
        };
    }
  };

  const info = getStatusInfo();
  const Icon = info.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full",
        info.bg,
        className
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          info.color,
          info.animate && "animate-spin"
        )}
      />
      {showLabel && (
        <span className={cn("text-xs font-medium", info.color)}>
          {info.label}
        </span>
      )}
    </div>
  );
}
