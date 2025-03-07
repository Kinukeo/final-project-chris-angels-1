import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthSignInForm from "./SignInForm";
import { supabase } from "../../lib/supabaseClient";

// Create mock for router
const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock the GoogleSignIn component
vi.mock("./GoogleSignIn", () => ({
  GoogleSignIn: ({
    buttonText,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loadingText,
  }: {
    buttonText?: string;
    loadingText?: string;
  }) => (
    <button data-testid="google-signin">
      {buttonText || "Sign up with Google"}
    </button>
  ),
}));

// Mock Link from Next.js
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock Supabase
vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

describe("AuthSignInForm Component", () => {
  const mockOnSuccess = vi.fn();
  const mockOnToggleToSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form correctly", () => {
    render(
      <AuthSignInForm
        onSuccess={mockOnSuccess}
        redirectTo="/dashboard"
        onToggleToSignUp={mockOnToggleToSignUp}
      />,
    );

    // Check main elements are present
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByTestId("google-signin")).toBeInTheDocument();
    expect(screen.getByText("Forgot your password?")).toBeInTheDocument();
  });

  it("handles input changes", () => {
    render(<AuthSignInForm />);

    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });
  it("toggles to sign up form when button is clicked", async () => {
    render(<AuthSignInForm onToggleToSignUp={mockOnToggleToSignUp} />);

    // Click the sign up button
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    // Check if the toggle callback was called
    expect(mockOnToggleToSignUp).toHaveBeenCalled();
  });

  it("handles non-Error objects in catch block", async () => {
    // Mock a non-Error object being thrown
    const nonErrorObject = "String error";
    vi.mocked(supabase.auth.signInWithPassword).mockImplementation(() => {
      throw nonErrorObject;
    });

    // Mock console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<AuthSignInForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if generic error message is displayed
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();

      // Check if console.error was called with the non-Error object
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error signing in:",
        nonErrorObject,
      );

      // Check if button returns to normal state
      expect(
        screen.getByRole("button", { name: "Sign in" }),
      ).toBeInTheDocument();
    });

    // Clean up
    consoleErrorSpy.mockRestore();
  });
});
