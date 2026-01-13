/**
 * useOffline Hook Tests
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useOffline } from "../../../hooks/use-offline";

describe("useOffline", () => {
  beforeEach(() => {
    // Reset online status
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
    
    // Mock connection API
    Object.defineProperty(navigator, "connection", {
      writable: true,
      value: {
        effectiveType: "4g",
        downlink: 10,
        rtt: 50,
        saveData: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    });
  });
  
  it("initializes with online status", () => {
    const { result } = renderHook(() => useOffline());
    
    expect(result.current.isOffline).toBe(false);
    expect(result.current.isOnline).toBe(true);
  });
  
  it("detects offline status", async () => {
    const { result } = renderHook(() => useOffline());
    
    expect(result.current.isOffline).toBe(false);
    
    // Go offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    
    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
      expect(result.current.isOnline).toBe(false);
    });
  });
  
  it("detects online status", async () => {
    // Start offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    const { result } = renderHook(() => useOffline());
    
    // Go online
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
    
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });
  });
  
  it("detects slow connection", () => {
    Object.defineProperty(navigator, "connection", {
      writable: true,
      value: {
        effectiveType: "2g",
        downlink: 0.5,
        rtt: 200,
        saveData: false,
      },
    });
    
    const { result } = renderHook(() => useOffline());
    
    expect(result.current.isSlowConnection).toBe(true);
  });
  
  it("detects fast connection", () => {
    Object.defineProperty(navigator, "connection", {
      writable: true,
      value: {
        effectiveType: "4g",
        downlink: 10,
        rtt: 50,
        saveData: false,
      },
    });
    
    const { result } = renderHook(() => useOffline());
    
    expect(result.current.isSlowConnection).toBe(false);
  });
  
  it("returns connection info", () => {
    const { result } = renderHook(() => useOffline());
    
    expect(result.current.connectionInfo).toEqual({
      effectiveType: "4g",
      downlink: 10,
      rtt: 50,
      saveData: false,
    });
  });
  
  it("detects save data mode", () => {
    Object.defineProperty(navigator, "connection", {
      writable: true,
      value: {
        effectiveType: "4g",
        downlink: 10,
        rtt: 50,
        saveData: true,
      },
    });
    
    const { result } = renderHook(() => useOffline());
    
    expect(result.current.connectionInfo?.saveData).toBe(true);
  });
  
  it("handles missing connection API", () => {
    Object.defineProperty(navigator, "connection", {
      writable: true,
      value: undefined,
    });
    
    const { result } = renderHook(() => useOffline());
    
    expect(result.current.connectionInfo).toBeNull();
    expect(result.current.isSlowConnection).toBe(false);
  });
  
  it("tracks last online time", async () => {
    const { result } = renderHook(() => useOffline());
    
    // Go offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    
    await waitFor(() => {
      expect(result.current.lastOnline).toBeDefined();
      expect(result.current.lastOnline).toBeInstanceOf(Date);
    });
  });
  
  it("calls onOffline callback", async () => {
    const onOffline = jest.fn();
    
    renderHook(() => useOffline({ onOffline }));
    
    // Go offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    
    await waitFor(() => {
      expect(onOffline).toHaveBeenCalled();
    });
  });
  
  it("calls onOnline callback", async () => {
    const onOnline = jest.fn();
    
    // Start offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    renderHook(() => useOffline({ onOnline }));
    
    // Go online
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
    
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    
    await waitFor(() => {
      expect(onOnline).toHaveBeenCalled();
    });
  });
});
