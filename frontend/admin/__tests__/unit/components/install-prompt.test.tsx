/**
 * PWA Install Prompt Component Tests
 */

import { renderWithProviders, screen, userEvent, waitFor } from "../../setup/test-utils";
import { InstallPrompt } from "../../../components/pwa/install-prompt";

describe("InstallPrompt", () => {
  let mockDeferredPrompt: any;
  
  beforeEach(() => {
    // Mock BeforeInstallPromptEvent
    mockDeferredPrompt = {
      prompt: jest.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    };
    
    // Mock getUserAgent
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124",
    });
  });
  
  it("renders nothing by default", () => {
    const { container } = renderWithProviders(<InstallPrompt />);
    expect(container.firstChild).toBeNull();
  });
  
  it("shows install prompt when beforeinstallprompt event fires", async () => {
    renderWithProviders(<InstallPrompt />);
    
    // Trigger beforeinstallprompt event
    const event = new Event("beforeinstallprompt");
    Object.assign(event, { preventDefault: jest.fn(), deferredPrompt: mockDeferredPrompt });
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(screen.getByText(/Install App/i)).toBeInTheDocument();
    });
  });
  
  it("calls prompt method when install button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InstallPrompt />);
    
    // Trigger event
    const event = new Event("beforeinstallprompt");
    Object.assign(event, mockDeferredPrompt);
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(screen.getByText(/Install/i)).toBeInTheDocument();
    });
    
    // Click install button
    const installButton = screen.getByRole("button", { name: /Install/i });
    await user.click(installButton);
    
    expect(mockDeferredPrompt.prompt).toHaveBeenCalled();
  });
  
  it("hides prompt when dismiss button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InstallPrompt />);
    
    // Trigger event
    const event = new Event("beforeinstallprompt");
    Object.assign(event, mockDeferredPrompt);
    window.dispatchEvent(event);
    
    await waitFor(() => {
      expect(screen.getByText(/Install/i)).toBeInTheDocument();
    });
    
    // Click dismiss button
    const dismissButton = screen.getByRole("button", { name: /Close/i });
    await user.click(dismissButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/Install/i)).not.toBeInTheDocument();
    });
  });
  
  it("detects iOS platform", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
    });
    
    renderWithProviders(<InstallPrompt />);
    
    const event = new Event("beforeinstallprompt");
    Object.assign(event, mockDeferredPrompt);
    window.dispatchEvent(event);
    
    // iOS should show share icon instructions
    waitFor(() => {
      expect(screen.getByText(/Share/i)).toBeInTheDocument();
    });
  });
  
  it("hides after successful installation", async () => {
    renderWithProviders(<InstallPrompt />);
    
    // Trigger beforeinstallprompt
    const beforeEvent = new Event("beforeinstallprompt");
    Object.assign(beforeEvent, mockDeferredPrompt);
    window.dispatchEvent(beforeEvent);
    
    await waitFor(() => {
      expect(screen.getByText(/Install/i)).toBeInTheDocument();
    });
    
    // Trigger appinstalled event
    const installedEvent = new Event("appinstalled");
    window.dispatchEvent(installedEvent);
    
    await waitFor(() => {
      expect(screen.queryByText(/Install/i)).not.toBeInTheDocument();
    });
  });
  
  it("auto-shows after delay when autoShow is enabled", async () => {
    jest.useFakeTimers();
    
    renderWithProviders(<InstallPrompt autoShow={true} delay={1000} />);
    
    const event = new Event("beforeinstallprompt");
    Object.assign(event, mockDeferredPrompt);
    window.dispatchEvent(event);
    
    // Should not show immediately
    expect(screen.queryByText(/Install/i)).not.toBeInTheDocument();
    
    // Fast-forward time
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText(/Install/i)).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });
  
  it("is accessible", async () => {
    const { container } = renderWithProviders(<InstallPrompt />);
    
    const event = new Event("beforeinstallprompt");
    Object.assign(event, mockDeferredPrompt);
    window.dispatchEvent(event);
    
    await waitFor(() => {
      const installButton = screen.getByRole("button", { name: /Install/i });
      expect(installButton).toHaveAccessibleName();
      
      const dismissButton = screen.getByRole("button", { name: /Close/i });
      expect(dismissButton).toHaveAccessibleName();
    });
  });
});
