import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // For the Realtime API GA version, we return the API key
    // The client will connect directly using the API key
    // Note: In production, implement more secure token management (e.g., short-lived JWT tokens)
    return NextResponse.json({
      apiKey: apiKey,
    });
  } catch (error: any) {
    console.error("Voice token error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create voice token" },
      { status: 500 }
    );
  }
}
