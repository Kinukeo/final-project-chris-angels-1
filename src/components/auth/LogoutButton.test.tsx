import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LogoutButton from "./LogoutButton";
import { supabase } from "@/lib/supabaseClient";

// Create a mock for the router push function
const mockRouterPush = vi.fn();

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

describe("LogoutButton Component", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<LogoutButton />);
    const button = screen.getByRole("button", { name: "Sign Out" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("shows loading state when signing out", async () => {
    // Mock successful signOut response
    const mockSignOutResponse = {
      error: null,
    };
    vi.mocked(supabase.auth.signOut).mockResolvedValue(mockSignOutResponse);

    render(<LogoutButton />);

    // Click the button to trigger sign out
    const button = screen.getByRole("button", { name: "Sign Out" });
    fireEvent.click(button);

    // Check if loading state is shown
    expect(
      await screen.findByRole("button", { name: "Signing out..." }),
    ).toBeInTheDocument();
    //expect(screen.getByRole('button')).toBeDisabled();

    // Wait for the process to complete
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Sign Out" }),
      ).toBeInTheDocument();
      // expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  it("handles unexpected exceptions during sign out", async () => {
    // Mock console.error and window.alert
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const alertMock = vi.fn();
    window.alert = alertMock;

    // Mock supabase to throw an unexpected error
    vi.mocked(supabase.auth.signOut).mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    render(<LogoutButton />);

    // Click the button to trigger sign out
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Check if error handling works correctly
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith(
        "Error signing out. Please try again.",
      );
      expect(mockRouterPush).not.toHaveBeenCalled();
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    // Clean up
    consoleErrorSpy.mockRestore();
  });
});
