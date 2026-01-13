/**
 * usePWA Hook Tests
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { usePWA } from "../../../hooks/use-pwa";

describe("usePWA", () => {
  let mockDeferredPrompt: any;
  
  beforeEach(() => {
    mockDeferredPrompt = {
      prompt: jest.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    };
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => null);
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it("initializes with default values", () => {
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.platform).toBe("unknown");
  });
  
  it("detects install capability when beforeinstallprompt fires", async () => {
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.canInstall).toBe(false);
    
    // Trigger beforeinstallprompt
    const event = new Event("beforeinstallprompt");
    Object.assign(event, mockDeferredPrompt);
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(result.current.canInstall).toBe(true);
    });
  });
  
  it("calls prompt when install is triggered", async () => {
    const { result } = renderHook(() => usePWA());
    
    // Setup install prompt
    const event = new Event("beforeinstallprompt");
    Object.assign(event, mockDeferredPrompt);
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(result.current.canInstall).toBe(true);
    });
    
    // Trigger install
    await act(async () => {
      await result.current.install();
    });
    
    expect(mockDeferredPrompt.prompt).toHaveBeenCalled();
  });
  
  it("marks as installed after successful installation", async () => {
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.isInstalled).toBe(false);
    
    // Trigger appinstalled event
    const event = new Event("appinstalled");
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(result.current.isInstalled).toBe(true);
      expect(result.current.canInstall).toBe(false);
    });
  });
  
  it("detects iOS platform", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
    });
    
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.platform).toBe("ios");
  });
  
  it("detects Android platform", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (Linux; Android 10) Chrome/91.0.4472.124",
    });
    
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.platform).toBe("android");
  });
  
  it("detects desktop platform", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0",
    });
    
    const { result } = renderHook(() => usePWA());
    
    expect(result.current.platform).toBe("desktop");
  });
  
  it("dismisses install prompt", async () => {
    const { result } = renderHook(() => usePWA());
    
    // Setup install prompt
    const event = new Event("beforeinstallprompt");
    Object.assign(event, mockDeferredPrompt);
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(result.current.canInstall).toBe(true);
    });
    
    // Dismiss
    act(() => {
      result.current.dismissPrompt();
    });
    
    expect(result.current.canInstall).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "pwa-install-dismissed",
      expect.any(String)
    );
  });
  
  it("respects dismiss timeout", () => {
    const dismissedTime = Date.now() - 1000; // 1 second ago
    Storage.prototype.getItem = jest.fn(() => dismissedTime.toString());
    
    const { result } = renderHook(() => usePWA());
    
    // Should still be dismissed (default timeout is 7 days)
    expect(result.current.canInstall).toBe(false);
  });
  
  it("clears dismiss after timeout", () => {
    const dismissedTime = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
    Storage.prototype.getItem = jest.fn(() => dismissedTime.toString());
    
    const { result } = renderHook(() => usePWA());
    
    // Should clear dismissed state
    expect(localStorage.removeItem).toHaveBeenCalledWith("pwa-install-dismissed");
  });
  
  it("handles install rejection", async () => {
    mockDeferredPrompt.userChoice = Promise.resolve({ outcome: "dismissed" });
    
    const { result } = renderHook(() => usePWA());
    
    // Setup install prompt
    const event = new Event("beforeinstallprompt");
    Object.assign(event, mockDeferredPrompt);
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(result.current.canInstall).toBe(true);
    });
    
    // Trigger install
    await act(async () => {
      await result.current.install();
    });
    
    // Should not mark as installed
    expect(result.current.isInstalled).toBe(false);
  });
});
