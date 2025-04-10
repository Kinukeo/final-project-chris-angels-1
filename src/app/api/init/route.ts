import { NextResponse } from "next/server";
import { populateMarthaData } from "@/utils/rag";

export async function GET() {
  try {
    console.log("Starting database initialization...");
    await populateMarthaData();

    return NextResponse.json({
      success: true,
      message:
        "Martha's data has been successfully populated in the vector database",
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize database",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
