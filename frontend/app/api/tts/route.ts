import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text, voice, persona } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Map personas to OpenAI voices if persona is provided
    const voiceMap: Record<string, "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"> = {
      professional: "echo",
      friendly: "alloy",
      motivator: "shimmer",
      advisor: "onyx",
    };

    const selectedVoice = voice || (persona ? voiceMap[persona] : undefined) || process.env.OPENAI_VOICE_NAME || "alloy";

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || "tts-1",
      voice: selectedVoice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      speed: persona === "motivator" ? 1.1 : 1.0, // Slightly faster for motivator
    });

    // Convert the response to a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Return the audio as an MP3 file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate speech" },
      { status: 500 }
    );
  }
}
