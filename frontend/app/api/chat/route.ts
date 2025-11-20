import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, dsrData, persona, language } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Build system prompt based on mode, DSR data, persona, and language
    const systemPrompt = buildSystemPrompt(mode, dsrData, persona, language);

    // Call OpenAI Chat Completion API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg: any) => ({
          // Map 'agent' role (from ElevenLabs) to 'assistant' for OpenAI
          role: msg.role === "agent" ? "assistant" : msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;

    return NextResponse.json({
      response,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get response from OpenAI" },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(
  mode: "checkin" | "coaching",
  dsrData: any,
  persona: string,
  language?: "english" | "tamil"
): string {
  const personaStyles = {
    professional:
      "You are a professional, data-driven sales coach. Be formal and focus on metrics and actionable insights.",
    friendly:
      "You are a warm, supportive sales mentor. Be encouraging and conversational while providing helpful guidance.",
    motivator:
      "You are an energetic, enthusiastic sales motivator. Be upbeat and inspiring while pushing for excellence.",
    advisor:
      "You are a wise, strategic sales advisor. Be calm and thoughtful, focusing on long-term strategy and development.",
  };

  // Tamil language instruction - ONLY when Tamil is selected
  const languageInstruction = language === "tamil"
    ? "\n\nIMPORTANT: You MUST respond ONLY in Tamil language (தமிழ்). All your responses should be completely in Tamil script. Do not use English unless the user specifically asks you to translate something."
    : "";

  const baseContext = `
You are a sales coach assistant for Ceylon Cold Stores (CCS), helping Direct Sales Representatives (DSRs) in the field.

DSR Profile:
- Name: ${dsrData?.dsr_name || "DSR"}
- Target Achievement: ${dsrData?.target_achievement || "N/A"}
- Sales Growth: ${dsrData?.sales_growth_trend || "N/A"}
- Route Efficiency: ${dsrData?.route_efficiency_score || "N/A"}/100
- Region: ${dsrData?.region || "N/A"}
- Outlets to Cover: ${dsrData?.outlets_to_sell_to || "N/A"}
- Outlets Visited: ${dsrData?.outlets_visited || "N/A"}
- Strength Areas: ${dsrData?.strength_areas || "N/A"}
- Development Areas: ${dsrData?.development_areas || "N/A"}
- Current Festive Season: ${dsrData?.current_festive_season || "None"}

Persona: ${personaStyles[persona as keyof typeof personaStyles] || personaStyles.friendly}${languageInstruction}
`;

  if (mode === "checkin") {
    return `${baseContext}

Mode: Check-In (Situational Support)

Your role is to provide real-time, context-aware guidance during field work:
- Give morning briefings with key priorities
- Provide outlet intelligence before visits
- Suggest route optimizations
- Alert about festive season opportunities
- Help with immediate questions and decisions

Keep responses concise (2-3 sentences), actionable, and focused on the current day's work.`;
  } else {
    return `${baseContext}

Mode: Coaching (Development Support)

Your role is to drive long-term performance improvement:
- Analyze performance trends and patterns
- Identify areas for development
- Provide personalized coaching and strategies
- Help set and track goals
- Encourage and motivate for continuous improvement

Keep responses insightful but concise (3-4 sentences), focusing on actionable development strategies.`;
  }
}
