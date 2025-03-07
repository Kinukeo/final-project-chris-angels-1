import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthSignUpForm from "./SignUpForm";
import { supabase } from "../../lib/supabaseClient";

// Create mock for window.location
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const originalLocation = window.location;
beforeEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { origin: "http://localhost:3000" },
  });
});

// Mock the GoogleSignIn component
vi.mock("../../components/auth/GoogleSignIn", () => ({
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

// Mock Supabase
vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

describe("AuthSignUpForm Component", () => {
  const mockOnSuccess = vi.fn();
  const mockOnToggleToSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form correctly", () => {
    render(
      <AuthSignUpForm
        onSuccess={mockOnSuccess}
        onToggleToSignIn={mockOnToggleToSignIn}
      />,
    );

    // Check main elements are present
    expect(screen.getByText("Create an account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByTestId("google-signin")).toBeInTheDocument();
  });

  it("handles input changes", () => {
    render(<AuthSignUpForm />);

    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
    expect(confirmPasswordInput).toHaveValue("password123");
  });

  it("shows error when passwords do not match", () => {
    render(<AuthSignUpForm />);

    // Fill in the form with mismatched passwords
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password456" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    // Check if error message is displayed
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();

    // Supabase signUp should not be called
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("shows error when password is too short", () => {
    render(<AuthSignUpForm />);

    // Fill in the form with a short password
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "12345" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "12345" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    // Check if error message is displayed
    expect(
      screen.getByText("Password must be at least 6 characters"),
    ).toBeInTheDocument();

    // Supabase signUp should not be called
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("handles non-Error objects in catch block", async () => {
    // Mock a non-Error object being thrown
    const nonErrorObject = "String error";
    vi.mocked(supabase.auth.signUp).mockImplementation(() => {
      throw nonErrorObject;
    });

    // Mock console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<AuthSignUpForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if generic error message is displayed
      expect(
        screen.getByText("An unknown error occurred during sign up"),
      ).toBeInTheDocument();

      // Check if console.error was called with the non-Error object
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Signup error:",
        nonErrorObject,
      );

      // Check if button returns to normal state
      expect(
        screen.getByRole("button", { name: "Sign up" }),
      ).toBeInTheDocument();
    });

    // Clean up
    consoleErrorSpy.mockRestore();
  });

  it("toggles to sign in form when button is clicked", () => {
    render(<AuthSignUpForm onToggleToSignIn={mockOnToggleToSignIn} />);

    // Click the sign in button
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    // Check if the toggle callback was called
    expect(mockOnToggleToSignIn).toHaveBeenCalled();
  });
});
