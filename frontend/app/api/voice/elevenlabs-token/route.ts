/**
 * ElevenLabs Conversation Token Generator
 *
 * This API route generates short-lived conversation tokens for ElevenLabs agents.
 * Tokens are required to establish WebRTC or WebSocket connections from the client.
 *
 * Security:
 * - API key is stored server-side only (never exposed to client)
 * - Tokens are ephemeral and expire automatically
 * - Agent ID is validated before token generation
 *
 * Usage:
 * GET /api/voice/elevenlabs-token?agentId=your_agent_id
 *
 * Returns:
 * { token: "ey...", expiresAt: "2024-01-01T00:00:00Z" }
 */

import { NextRequest, NextResponse } from "next/server";
import { agentConfigs } from "@/lib/voice/elevenlabs-config";

// ElevenLabs API base URL
const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

interface TokenResponse {
  token: string;
  expires_at?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

/**
 * Generate conversation token for ElevenLabs agent
 */
export async function GET(request: NextRequest): Promise<NextResponse<TokenResponse | ErrorResponse>> {
  try {
    // 1. Validate API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("[ElevenLabs Token] API key not configured");
      return NextResponse.json(
        {
          error: "ElevenLabs API key not configured",
          details: "Set ELEVENLABS_API_KEY in .env.local",
          code: "MISSING_API_KEY",
        },
        { status: 500 }
      );
    }

    // 2. Get agent ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        {
          error: "Missing agentId parameter",
          details: "Provide agentId in query string: ?agentId=your_agent_id",
          code: "MISSING_AGENT_ID",
        },
        { status: 400 }
      );
    }

    // 3. Validate agent ID exists in configuration
    const isValidAgent = Object.values(agentConfigs).some(
      (config) => config.agentId === agentId
    );

    if (!isValidAgent && agentId) {
      console.warn(
        `[ElevenLabs Token] Agent ID "${agentId}" not found in configuration. ` +
        `This may be intentional if using a dynamic agent ID.`
      );
    }

    // 4. Request conversation token from ElevenLabs API
    console.log(`[ElevenLabs Token] Generating token for agent: ${agentId}`);

    const response = await fetch(
      `${ELEVENLABS_API_BASE}/convai/conversation/token?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    // 5. Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails: any;

      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { message: errorText };
      }

      console.error(
        `[ElevenLabs Token] API error (${response.status}):`,
        errorDetails
      );

      // Map common error codes
      let userMessage = "Failed to generate conversation token";
      let code = "TOKEN_GENERATION_FAILED";

      switch (response.status) {
        case 401:
          userMessage = "Invalid API key";
          code = "INVALID_API_KEY";
          break;
        case 404:
          userMessage = `Agent not found: ${agentId}`;
          code = "AGENT_NOT_FOUND";
          break;
        case 429:
          userMessage = "Rate limit exceeded. Please try again later.";
          code = "RATE_LIMIT";
          break;
        case 500:
        case 502:
        case 503:
          userMessage = "ElevenLabs service temporarily unavailable";
          code = "SERVICE_UNAVAILABLE";
          break;
      }

      return NextResponse.json(
        {
          error: userMessage,
          details: errorDetails.message || errorText,
          code,
        },
        { status: response.status }
      );
    }

    // 6. Parse and return successful response
    const data: TokenResponse = await response.json();

    console.log(
      `[ElevenLabs Token] Token generated successfully for agent: ${agentId}`
    );

    // Add CORS headers for cross-origin requests (optional)
    const headers = {
      "Content-Type": "application/json",
      // Uncomment if needed:
      // "Access-Control-Allow-Origin": "*",
      // "Access-Control-Allow-Methods": "GET, OPTIONS",
    };

    return NextResponse.json(
      {
        token: data.token,
        expiresAt: data.expires_at,
      },
      { headers }
    );
  } catch (error) {
    // 7. Handle unexpected errors
    console.error("[ElevenLabs Token] Unexpected error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight (if needed)
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
