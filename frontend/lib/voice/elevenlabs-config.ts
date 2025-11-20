/**
 * ElevenLabs Voice Agent Configuration
 *
 * This file centralizes all ElevenLabs-related configuration including:
 * - Agent IDs for different personas
 * - Voice IDs and characteristics
 * - Connection settings
 * - Client tools configuration
 *
 * To configure:
 * 1. Create agents in ElevenLabs dashboard (https://elevenlabs.io/app/conversational-ai)
 * 2. Copy agent IDs here
 * 3. Optionally customize voice IDs (default: agent's configured voice)
 * 4. Set ELEVENLABS_API_KEY in .env.local
 */

import { PersonaType } from "@/types";

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

export interface AgentConfig {
  /** Agent ID from ElevenLabs dashboard */
  agentId: string;
  /** Display name for the agent */
  name: string;
  /** Optional: Override voice ID (if not set, uses agent's default voice) */
  voiceId?: string;
  /** System prompt override (optional) */
  systemPrompt?: string;
  /** First message override (optional) */
  firstMessage?: string;
  /** Description of agent's personality */
  description: string;
  /** Language code (en, si, ta) */
  language?: string;
}

export interface LanguageAgentConfig {
  /** English agent configuration */
  english: AgentConfig;
  /** Tamil agent configuration */
  tamil?: AgentConfig;
}

/**
 * Single Tamil agent that handles all personas
 * When Tamil is selected, this agent is used regardless of persona
 */
const tamilAgentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_TAMIL || "";

/**
 * Agent mappings for each persona type with language support
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://elevenlabs.io/app/conversational-ai
 * 2. Create 4 separate English agents (one for each persona)
 * 3. Create 1 Tamil agent (used for all personas)
 * 4. Copy the agent IDs to your .env.local file
 *
 * Environment variables:
 * English Agents (persona-specific):
 * - NEXT_PUBLIC_ELEVENLABS_AGENT_PROFESSIONAL
 * - NEXT_PUBLIC_ELEVENLABS_AGENT_FRIENDLY
 * - NEXT_PUBLIC_ELEVENLABS_AGENT_MOTIVATOR
 * - NEXT_PUBLIC_ELEVENLABS_AGENT_ADVISOR
 * 
 * Tamil Agent (shared across all personas):
 * - NEXT_PUBLIC_ELEVENLABS_AGENT_TAMIL
 */
export const agentConfigs: Record<PersonaType, LanguageAgentConfig> = {
  professional: {
    english: {
      agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_PROFESSIONAL || "",
      name: "Professional Sales Coach",
      description: "Formal, data-driven coach focusing on analytics and performance metrics",
      language: "en",
    },
    tamil: {
      agentId: tamilAgentId,
      name: "Sales Coach (Tamil)",
      description: "Tamil sales coach",
      language: "ta",
    },
  },
  friendly: {
    english: {
      agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_FRIENDLY || "",
      name: "Friendly Mentor",
      description: "Warm, supportive mentor with an encouraging approach",
      language: "en",
    },
    tamil: {
      agentId: tamilAgentId,
      name: "Sales Coach (Tamil)",
      description: "Tamil sales coach",
      language: "ta",
    },
  },
  motivator: {
    english: {
      agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_MOTIVATOR || "",
      name: "Energetic Motivator",
      description: "Enthusiastic, high-energy coach that celebrates wins",
      language: "en",
    },
    tamil: {
      agentId: tamilAgentId,
      name: "Sales Coach (Tamil)",
      description: "Tamil sales coach",
      language: "ta",
    },
  },
  advisor: {
    english: {
      agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ADVISOR || "",
      name: "Strategic Advisor",
      description: "Calm, wise advisor with strategic insights",
      language: "en",
    },
    tamil: {
      agentId: tamilAgentId,
      name: "Sales Coach (Tamil)",
      description: "Tamil sales coach",
      language: "ta",
    },
  },
};

/**
 * Get agent configuration for a specific persona and language
 * Note: For Tamil, all personas use the same agent (single Tamil agent for all)
 */
export function getAgentConfig(persona: PersonaType, language: "english" | "tamil" = "english"): AgentConfig {
  const config = agentConfigs[persona];
  
  // Get language-specific config, fallback to English if Tamil not available
  const languageConfig = language === "tamil" && config.tamil 
    ? config.tamil 
    : config.english;

  if (!languageConfig.agentId) {
    const envVar = language === "tamil" 
      ? `NEXT_PUBLIC_ELEVENLABS_AGENT_TAMIL (single agent for all personas)`
      : `NEXT_PUBLIC_ELEVENLABS_AGENT_${persona.toUpperCase()}`;
    
    console.warn(
      `Agent ID not configured for ${language} language. ` +
      `Set ${envVar} in .env.local`
    );
  }

  return languageConfig;
}

// ============================================================================
// VOICE LIBRARY
// ============================================================================

/**
 * Popular voice IDs from ElevenLabs
 * Browse more at: https://elevenlabs.io/voice-library
 */
export const popularVoices = {
  // Professional/Business
  rachel: "21m00Tcm4TlvDq8ikWAM", // Professional, clear
  drew: "29vD33N1CtxCmqQRPOHJ", // Confident, authoritative

  // Friendly/Warm
  bella: "EXAVITQu4vr4xnSDxMaL", // Warm, friendly
  josh: "TxGEqnHWrfWFTfGW9XjX", // Casual, relatable

  // Energetic
  elli: "MF3mGyEYCl7XYWbV9V6O", // Young, energetic
  sarah: "EXAVITQu4vr4xnSDxMaL", // Upbeat, enthusiastic

  // Deep/Authoritative
  clyde: "2EiwWnXFnvU5JabPnv8n", // Deep, mature
  adam: "pNInz6obpgDQGcFmaJgB", // Deep, professional
};

// ============================================================================
// CONNECTION SETTINGS
// ============================================================================

export interface ConnectionConfig {
  /** Connection type: 'webrtc' (recommended) or 'websocket' */
  type: "webrtc" | "websocket";
  /** Server location for data residency */
  serverLocation: "us" | "eu-residency" | "in-residency" | "global";
  /** Enable text-only mode (no audio) */
  textOnly: boolean;
  /** Auto-connect when component mounts */
  autoConnect: boolean;
  /** Microphone sample rate (Hz) */
  sampleRate: number;
}

/**
 * Default connection settings
 * Can be overridden per-session
 */
export const defaultConnectionConfig: ConnectionConfig = {
  type: "webrtc", // WebRTC recommended for lower latency
  serverLocation: "us", // Change based on your region
  textOnly: false, // Enable audio by default
  autoConnect: false, // Manual connection control
  sampleRate: 16000, // Standard quality (16kHz)
};

// ============================================================================
// CLIENT TOOLS CONFIGURATION
// ============================================================================

/**
 * Client-side tools that agents can invoke during conversations
 * These functions are called by the AI agent to perform actions
 *
 * Example use cases:
 * - Display UI components (maps, charts, cards)
 * - Record data (check-ins, notes)
 * - Navigate to different pages
 * - Trigger animations or notifications
 */
export interface ClientTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  handler: (params: any) => Promise<string> | string;
}

/**
 * Available client tools for sales coaching agents
 * Configure these in your ElevenLabs agent dashboard under "Client Tools"
 */
export const clientTools = {
  /**
   * Display priority outlets on a map or list
   */
  showPriorityOutlets: {
    name: "showPriorityOutlets",
    description: "Display a list of priority outlets the DSR should visit today",
    handler: (params: { count?: number }) => {
      console.log("[Client Tool] Showing priority outlets:", params);
      // Implementation in chat interface will handle UI updates
      return "Priority outlets displayed successfully";
    },
  },

  /**
   * Record a field check-in
   */
  recordCheckIn: {
    name: "recordCheckIn",
    description: "Record a check-in at an outlet with notes",
    handler: (params: { outlet_id: string; notes: string; timestamp?: string }) => {
      console.log("[Client Tool] Recording check-in:", params);
      // TODO: Integrate with your backend API
      return `Check-in recorded for outlet ${params.outlet_id}`;
    },
  },

  /**
   * Show performance metrics
   */
  showPerformanceMetrics: {
    name: "showPerformanceMetrics",
    description: "Display current performance metrics and charts",
    handler: (params: { metric?: string }) => {
      console.log("[Client Tool] Showing performance metrics:", params);
      return "Performance metrics displayed";
    },
  },

  /**
   * Schedule a follow-up reminder
   */
  scheduleFollowUp: {
    name: "scheduleFollowUp",
    description: "Schedule a follow-up reminder for an outlet",
    handler: (params: { outlet_id: string; date: string; reason: string }) => {
      console.log("[Client Tool] Scheduling follow-up:", params);
      // TODO: Integrate with calendar/reminder system
      return `Follow-up scheduled for ${params.date}`;
    },
  },

  /**
   * Get DSR performance details
   */
  getDSRPerformance: {
    name: "getDSRPerformance",
    description: "Get detailed performance metrics for the current DSR",
    handler: (params: { metric?: string }) => {
      console.log("[Client Tool] Getting DSR performance:", params);
      // This will be populated with actual data from the store
      return "Performance data retrieved. Check the context for details.";
    },
  },

  /**
   * Get route information
   */
  getRouteInfo: {
    name: "getRouteInfo",
    description: "Get information about the current route and outlets",
    handler: (params: { route_id?: string }) => {
      console.log("[Client Tool] Getting route info:", params);
      // This will be populated with actual data from the store
      return "Route information retrieved. Check the context for details.";
    },
  },
} as const;

/**
 * Get all client tool handlers as an object
 * Pass this to useConversation hook
 */
export function getClientToolHandlers() {
  return Object.entries(clientTools).reduce((acc, [key, tool]) => {
    acc[tool.name] = tool.handler;
    return acc;
  }, {} as Record<string, (params: any) => Promise<string> | string>);
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const errorMessages = {
  noApiKey: "ElevenLabs API key not found. Set ELEVENLABS_API_KEY in .env.local",
  noAgentId: (persona: string) =>
    `Agent ID not configured for "${persona}" persona. ` +
    `Set NEXT_PUBLIC_ELEVENLABS_AGENT_${persona.toUpperCase()} in .env.local`,
  connectionFailed: "Failed to connect to ElevenLabs. Please check your internet connection and try again.",
  microphonePermissionDenied: "Microphone access denied. Please enable microphone permissions in your browser settings.",
  tokenGenerationFailed: "Failed to generate conversation token. Please check your API key and try again.",
  sessionStartFailed: "Failed to start voice session. Please try again.",
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate that all required configurations are set
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check API key (server-side only)
  if (typeof window === "undefined") {
    if (!process.env.ELEVENLABS_API_KEY) {
      errors.push(errorMessages.noApiKey);
    }
  }

  // Check agent IDs (client-side)
  Object.entries(agentConfigs).forEach(([persona, config]) => {
    if (!config.agentId) {
      errors.push(errorMessages.noAgentId(persona));
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get dynamic greeting based on persona and context
 */
export function getPersonalizedGreeting(
  persona: PersonaType,
  dsrName: string,
  timeOfDay: "morning" | "afternoon" | "evening",
  mode: "checkin" | "coaching"
): string {
  const time = timeOfDay;

  const greetings = {
    professional: {
      checkin: `Good ${time}, ${dsrName}. Ready to log your check-in?`,
      coaching: `Good ${time}, ${dsrName}. Let's review your performance objectives.`,
    },
    friendly: {
      checkin: `Hey ${dsrName}! How did the visit go?`,
      coaching: `Hey ${dsrName}! Ready to talk about your awesome progress?`,
    },
    motivator: {
      checkin: `${dsrName}! ANOTHER VISIT CONQUERED! Tell me about it!`,
      coaching: `${dsrName}! LET'S CELEBRATE YOUR WINS AND CRUSH THOSE GOALS!`,
    },
    advisor: {
      checkin: `Good ${time}, ${dsrName}. Let's strategically document this visit.`,
      coaching: `Good ${time}, ${dsrName}. Let's analyze your performance patterns.`,
    },
  };

  return greetings[persona][mode];
}

/**
 * Export configuration summary for debugging
 */
export function getConfigSummary() {
  return {
    agents: Object.entries(agentConfigs).map(([persona, config]) => ({
      persona,
      name: config.name,
      configured: !!config.agentId,
      agentId: config.agentId ? `${config.agentId.substring(0, 8)}...` : "NOT SET",
    })),
    connection: defaultConnectionConfig,
    clientTools: Object.keys(clientTools),
  };
}

/**
 * Map application language codes to ElevenLabs language codes
 */
export function getLanguageCode(language: "english" | "tamil"): string {
  const languageMap: Record<"english" | "tamil", string> = {
    english: "en",
    tamil: "ta",
  };
  return languageMap[language] || "en";
}
