import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the utility functions
vi.mock("@/utils/rag", () => ({
  populateMarthaData: vi.fn(),
}));

// Import the mocked functions for use in tests
import { populateMarthaData } from "@/utils/rag";

// Import the route handlers
import * as route from "./route";

describe("RAG Initialization API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  describe("GET handler", () => {
    it("should initialize the database successfully", async () => {
      // Mock successful database population
      vi.mocked(populateMarthaData).mockResolvedValue(true);

      // Create a mock request
      const request = new Request("http://localhost", {
        method: "GET",
      });

      if (!request) {
        console.log("check request variable around line 26");
      }

      const response = await route.GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        message:
          "Martha's data has been successfully populated in the vector database",
      });
      expect(populateMarthaData).toHaveBeenCalled();
    });

    it("should handle errors during initialization", async () => {
      // Mock an error during database population
      const errorMessage = "Database connection failed";
      vi.mocked(populateMarthaData).mockRejectedValue(new Error(errorMessage));

      const response = await route.GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        message: "Failed to initialize database",
        error: errorMessage,
      });
    });
  });
});
