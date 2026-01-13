/**
 * Offline Indicator Component Tests
 */

import { renderWithProviders, screen, waitFor } from "../../setup/test-utils";
import { OfflineIndicator } from "../../../components/pwa/offline-indicator";

describe("OfflineIndicator", () => {
  beforeEach(() => {
    // Reset online status
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  });
  
  it("renders nothing when online", () => {
    const { container } = renderWithProviders(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });
  
  it("shows indicator when offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    renderWithProviders(<OfflineIndicator />);
    
    // Trigger offline event
    window.dispatchEvent(new Event("offline"));
    
    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });
  });
  
  it("hides indicator when connection restored", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    renderWithProviders(<OfflineIndicator />);
    
    // Go offline
    window.dispatchEvent(new Event("offline"));
    
    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });
    
    // Go back online
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
    window.dispatchEvent(new Event("online"));
    
    await waitFor(() => {
      expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
    });
  });
  
  it("renders as banner variant", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    renderWithProviders(<OfflineIndicator variant="banner" />);
    
    window.dispatchEvent(new Event("offline"));
    
    await waitFor(() => {
      const element = screen.getByText(/offline/i).closest("div");
      expect(element).toHaveClass("banner");
    });
  });
  
  it("renders as badge variant", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    renderWithProviders(<OfflineIndicator variant="badge" />);
    
    window.dispatchEvent(new Event("offline"));
    
    await waitFor(() => {
      const element = screen.getByText(/offline/i).closest("div");
      expect(element).toHaveClass("badge");
    });
  });
  
  it("shows custom message", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    renderWithProviders(
      <OfflineIndicator message="Custom offline message" />
    );
    
    window.dispatchEvent(new Event("offline"));
    
    await waitFor(() => {
      expect(screen.getByText("Custom offline message")).toBeInTheDocument();
    });
  });
  
  it("is accessible", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });
    
    renderWithProviders(<OfflineIndicator />);
    
    window.dispatchEvent(new Event("offline"));
    
    await waitFor(() => {
      const indicator = screen.getByRole("status");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute("aria-live", "polite");
    });
  });
});
