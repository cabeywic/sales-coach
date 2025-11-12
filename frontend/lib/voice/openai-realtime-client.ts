import { PersonaType, DSRData } from "@/types";

interface RealtimeClientConfig {
  onMessage?: (text: string) => void;
  onError?: (error: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;
  private config: RealtimeClientConfig;
  private isConnected = false;
  private token: string | null = null;

  constructor(config: RealtimeClientConfig) {
    this.config = config;
  }

  async connect(dsrData: DSRData | null, persona: PersonaType, mode: "checkin" | "coaching") {
    try {
      // Get API key from our backend
      const tokenResponse = await fetch("/api/voice/token", {
        method: "POST",
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get API key");
      }

      const { apiKey } = await tokenResponse.json();
      this.token = apiKey;

      // Connect to OpenAI Realtime API GA version with WebSocket
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const url = `wss://api.openai.com/v1/realtime?model=${model}`;

      this.ws = new WebSocket(url, [
        "realtime",
        `openai-insecure-api-key.${apiKey}`,
        "openai-beta.realtime-v1"
      ]);

      this.ws.onopen = () => {
        console.log("Connected to OpenAI Realtime API");
        this.isConnected = true;

        // Send initial session configuration
        this.sendSessionUpdate(dsrData, persona, mode);

        if (this.config.onConnected) {
          this.config.onConnected();
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (this.config.onError) {
          this.config.onError(error);
        }
      };

      this.ws.onclose = () => {
        console.log("Disconnected from OpenAI Realtime API");
        this.isConnected = false;
        if (this.config.onDisconnected) {
          this.config.onDisconnected();
        }
      };
    } catch (error) {
      console.error("Failed to connect:", error);
      if (this.config.onError) {
        this.config.onError(error);
      }
    }
  }

  private sendSessionUpdate(dsrData: DSRData | null, persona: PersonaType, mode: "checkin" | "coaching") {
    const systemPrompt = this.buildSystemPrompt(dsrData, persona, mode);

    const sessionConfig = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: systemPrompt,
        voice: this.getVoiceForPersona(persona),
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        temperature: 0.8,
      },
    };

    this.send(sessionConfig);
  }

  private buildSystemPrompt(dsrData: DSRData | null, persona: PersonaType, mode: "checkin" | "coaching"): string {
    const personaStyles = {
      professional: "You speak formally and focus on data and metrics. Be concise and professional.",
      friendly: "You speak warmly and supportively. Be encouraging and conversational.",
      motivator: "You speak energetically and enthusiastically. Be upbeat and inspiring.",
      advisor: "You speak calmly and strategically. Be thoughtful and wise.",
    };

    const baseContext = `You are a sales coach assistant for Ceylon Cold Stores, helping DSR ${dsrData?.dsr_name || "the sales representative"}.

DSR Context:
- Target Achievement: ${dsrData?.target_achievement || "N/A"}
- Sales Growth: ${dsrData?.sales_growth_trend || "N/A"}
- Route Efficiency: ${dsrData?.route_efficiency_score || "N/A"}/100
- Outlets to Visit: ${dsrData?.outlets_to_sell_to || "N/A"}
- Current Festive Season: ${dsrData?.current_festive_season || "None"}

Persona: ${personaStyles[persona]}

IMPORTANT: Keep all responses brief (1-2 sentences for check-in, 2-3 for coaching). Speak naturally as if in a phone conversation.`;

    if (mode === "checkin") {
      return `${baseContext}\n\nMode: Check-In. Provide quick, actionable guidance for today's field work. Focus on priorities, outlets, and immediate decisions.`;
    } else {
      return `${baseContext}\n\nMode: Coaching. Help improve performance through insights, strategies, and motivation. Focus on development and long-term improvement.`;
    }
  }

  private getVoiceForPersona(persona: PersonaType): string {
    const voiceMap = {
      professional: "echo",
      friendly: "alloy",
      motivator: "shimmer",
      advisor: "onyx",
    };
    return voiceMap[persona] || "alloy";
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "conversation.item.created":
        if (message.item.role === "assistant" && message.item.content) {
          const transcript = message.item.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join(" ");

          if (transcript && this.config.onMessage) {
            this.config.onMessage(transcript);
          }
        }
        break;

      case "response.audio.delta":
        // Audio chunk received - will be automatically played by the API
        break;

      case "response.audio.done":
        // Full audio response completed
        break;

      case "error":
        console.error("Realtime API error:", message.error);
        if (this.config.onError) {
          this.config.onError(message.error);
        }
        break;

      case "response.done":
        // Response completed
        break;

      default:
        // Handle other message types as needed
        break;
    }
  }

  sendAudio(audioData: ArrayBuffer) {
    if (!this.isConnected || !this.ws) {
      console.warn("Not connected to send audio");
      return;
    }

    const event = {
      type: "input_audio_buffer.append",
      audio: this.arrayBufferToBase64(audioData),
    };

    this.send(event);
  }

  commitAudio() {
    if (!this.isConnected || !this.ws) {
      return;
    }

    this.send({ type: "input_audio_buffer.commit" });
  }

  sendText(text: string) {
    if (!this.isConnected || !this.ws) {
      console.warn("Not connected to send text");
      return;
    }

    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: text,
          },
        ],
      },
    };

    this.send(event);
    this.send({ type: "response.create" });
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
