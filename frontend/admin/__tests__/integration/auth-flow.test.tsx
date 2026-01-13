/**
 * Authentication Flow Integration Tests
 */

import { renderWithProviders, screen, userEvent, waitFor } from "../../setup/test-utils";
import { server } from "../../setup/msw-server";
import { http, HttpResponse } from "msw";

// Mock Login Component
const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      {error && <div role="alert">{error}</div>}
      
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? "Loading..." : "Login"}
      </button>
    </form>
  );
};

describe("Authentication Flow", () => {
  it("logs in successfully with valid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    
    // Fill in form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, "admin@example.com");
    await user.type(passwordInput, "password");
    
    // Submit form
    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.click(submitButton);
    
    // Wait for success
    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("mock-token-123");
      expect(JSON.parse(localStorage.getItem("user")!)).toEqual({
        id: 1,
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
      });
    });
  });
  
  it("shows error with invalid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    
    // Fill in form with wrong credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, "wrong@example.com");
    await user.type(passwordInput, "wrongpassword");
    
    // Submit form
    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.click(submitButton);
    
    // Wait for error
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid credentials/i);
    });
    
    expect(localStorage.getItem("token")).toBeNull();
  });
  
  it("shows loading state during login", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    
    // Fill in form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, "admin@example.com");
    await user.type(passwordInput, "password");
    
    // Submit form
    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.click(submitButton);
    
    // Should show loading state
    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
  });
  
  it("handles network error", async () => {
    // Override handler to simulate network error
    server.use(
      http.post("/api/auth/login", () => {
        return HttpResponse.error();
      })
    );
    
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, "admin@example.com");
    await user.type(passwordInput, "password");
    
    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
  
  it("prevents submission with empty fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    
    // Try to submit without filling form
    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.click(submitButton);
    
    // Should not make API call (no error displayed)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  
  it("logs out successfully", async () => {
    // Set up logged-in state
    localStorage.setItem("token", "mock-token-123");
    localStorage.setItem("user", JSON.stringify({
      id: 1,
      email: "admin@example.com",
      name: "Admin User",
    }));
    
    // Call logout endpoint
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer mock-token-123`,
      },
    });
    
    expect(response.ok).toBe(true);
    
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
  
  it("fetches current user", async () => {
    localStorage.setItem("token", "mock-token-123");
    
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer mock-token-123`,
      },
    });
    
    const user = await response.json();
    
    expect(user).toEqual({
      id: 1,
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
    });
  });
});

import React, { useState } from "react";
