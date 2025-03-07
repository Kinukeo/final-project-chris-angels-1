import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoogleSignIn } from "./GoogleSignIn";
import { supabase } from "@/lib/supabaseClient";
import { Provider } from "@supabase/supabase-js";

// Mock supabase
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

// Mock window.location
const originalLocation = window.location;
beforeEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { origin: "http://localhost:3000" },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
  vi.clearAllMocks();
});

describe("GoogleSignIn Component", () => {
  it("renders with default props", () => {
    render(<GoogleSignIn />);
    const button = screen.getByRole("button", { name: "Sign up with Google" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("renders with custom button text", () => {
    render(<GoogleSignIn buttonText="Login with Google" />);
    const button = screen.getByRole("button", { name: "Login with Google" });
    expect(button).toBeInTheDocument();
  });

  it("calls supabase.auth.signInWithOAuth with correct parameters", async () => {
    // Mock successful OAuth response
    const mockSignInResponse = {
      data: { provider: "google" as Provider, url: "https://google.com/auth" },
      error: null,
    };
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue(
      mockSignInResponse,
    );

    render(<GoogleSignIn />);

    // Click the button to trigger sign in
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Check if supabase.auth.signInWithOAuth was called with correct parameters
    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
        },
      });
    });
  });

  it("handles unexpected exceptions during sign in", async () => {
    // Mock console.error and window.alert
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const alertMock = vi.fn();
    window.alert = alertMock;

    // Mock supabase to throw an unexpected error
    vi.mocked(supabase.auth.signInWithOAuth).mockImplementation(() => {
      throw "Unexpected error";
    });

    render(<GoogleSignIn />);

    // Click the button to trigger sign in
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Check if error handling works correctly
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Google Sign In Error:",
        "Unexpected error",
      );
      expect(alertMock).toHaveBeenCalledWith(
        "Error signing in with Google: Unexpected error",
      );
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    // Clean up
    consoleErrorSpy.mockRestore();
  });

  it("applies custom className when provided", () => {
    render(<GoogleSignIn className="custom-button" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-button");
  });
});
