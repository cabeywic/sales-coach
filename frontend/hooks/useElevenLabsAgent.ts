/**
 * ElevenLabs Voice Agent Hook
 *
 * This hook provides a clean interface for managing voice conversations
 * with ElevenLabs conversational AI agents.
 *
 * Features:
 * - Automatic connection management
 * - Message history tracking
 * - Client-side tool integration
 * - Error handling and recovery
 * - Microphone permission management
 * - Dynamic persona switching
 *
 * Usage:
 * ```tsx
 * const agent = useElevenLabsAgent({
 *   persona: "friendly",
 *   mode: "coaching",
 *   onMessage: (msg) => console.log(msg),
 * });
 *
 * // Connect
 * await agent.connect();
 *
 * // Send text message
 * agent.sendMessage("How am I performing?");
 *
 * // Disconnect
 * await agent.disconnect();
 * ```
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useConversation } from "@elevenlabs/react";
import { useStore } from "@/store/useStore";
import { PersonaType } from "@/types";
import {
  getAgentConfig,
  getClientToolHandlers,
  getPersonalizedGreeting,
  defaultConnectionConfig,
  errorMessages,
  getLanguageCode,
} from "@/lib/voice/elevenlabs-config";
import {
  formatDSRContext,
  formatCheckInContext,
  formatCoachingContext,
} from "@/lib/voice/dsr-context";

// ============================================================================
// TYPES
// ============================================================================

export interface UseElevenLabsAgentOptions {
  /** Persona type (professional, friendly, motivator, advisor) */
  persona: PersonaType;
  /** Mode: checkin or coaching */
  mode: "checkin" | "coaching";
  /** Callback when a message is received */
  onMessage?: (message: AgentMessage) => void;
  /** Callback when connection state changes */
  onConnectionChange?: (connected: boolean) => void;
  /** Callback when speaking state changes */
  onSpeakingChange?: (speaking: boolean) => void;
  /** Callback when an error occurs */
  onError?: (error: AgentError) => void;
  /** Auto-connect on mount (default: false) */
  autoConnect?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

export interface AgentMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  metadata?: {
    mode?: string;
    persona?: string;
    conversationId?: string;
  };
}

export interface AgentError {
  code: string;
  message: string;
  details?: any;
}

export interface AgentState {
  /** Whether voice session is connected */
  connected: boolean;
  /** Whether agent is currently speaking */
  speaking: boolean;
  /** Whether system is listening for user input */
  listening: boolean;
  /** Current conversation ID */
  conversationId: string | null;
  /** Connection error if any */
  error: AgentError | null;
  /** Whether microphone permission is granted */
  microphonePermissionGranted: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useElevenLabsAgent(options: UseElevenLabsAgentOptions) {
  const {
    persona,
    mode,
    onMessage,
    onConnectionChange,
    onSpeakingChange,
    onError,
    autoConnect = false,
    debug = false,
  } = options;

  // Zustand store
  const { currentDSR, addMessage, setIsSpeaking, setIsListening, settings } = useStore();

  // Local state
  const [state, setState] = useState<AgentState>({
    connected: false,
    speaking: false,
    listening: false,
    conversationId: null,
    error: null,
    microphonePermissionGranted: false,
  });

  const [isConnecting, setIsConnecting] = useState(false);

  // Refs
  const conversationIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  // Agent configuration with language support
  const agentConfig = getAgentConfig(persona, settings.language);

  // Debug logger
  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log("[ElevenLabsAgent]", ...args);
      }
    },
    [debug]
  );

  // Memoize client tools to prevent re-creating on every render
  const clientToolHandlers = useMemo(() => getClientToolHandlers(), []);

  // Memoize overrides to prevent re-creating on every render
  const conversationOverrides = useMemo(() => {
    return {
      // Only override system prompt if provided in config
      ...(agentConfig.systemPrompt && {
        agent: {
          prompt: { prompt: agentConfig.systemPrompt },
        },
      }),
      // Only override voice if provided in config
      ...(agentConfig.voiceId && {
        tts: { voiceId: agentConfig.voiceId },
      }),
    };
  }, [agentConfig.systemPrompt, agentConfig.voiceId]);

  // Memoize event handlers
  const handleConnect = useCallback((data?: any) => {
    console.log("[ElevenLabsAgent] ===== HANDLE CONNECT CALLED =====");
    console.log("[ElevenLabsAgent] onConnect data:", JSON.stringify(data, null, 2));
    log("Connected to ElevenLabs");
    setState((prev) => {
      console.log("[ElevenLabsAgent] Setting connected=true. Previous state:", prev);
      return { ...prev, connected: true, error: null };
    });
    setIsListening(true);
    onConnectionChange?.(true);
    console.log("[ElevenLabsAgent] ===== HANDLE CONNECT DONE =====");
  }, [log, setIsListening, onConnectionChange]);

  const handleDisconnect = useCallback(() => {
    log("Disconnected from ElevenLabs");
    setState((prev) => ({
      ...prev,
      connected: false,
      speaking: false,
      listening: false,
      conversationId: null,
    }));
    setIsSpeaking(false);
    setIsListening(false);
    onConnectionChange?.(false);
  }, [log, setIsSpeaking, setIsListening, onConnectionChange]);

  const handleMessage = useCallback((message: any) => {
    console.log("[ElevenLabsAgent] 💬 RAW Message received:", JSON.stringify(message, null, 2));
    log("Message received:", message);

    // ElevenLabs sends messages in different formats
    // Check for text content in various possible fields
    const content =
      message.text ||
      message.message ||
      message.content ||
      (message.type === 'agent_response' && message.response) ||
      '';

    // Only process messages with actual content
    if (!content || content.trim() === '') {
      console.log("[ElevenLabsAgent] ⚠️ Skipping empty message");
      return;
    }

    // Parse message content
    const agentMessage: AgentMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      role: "agent",
      content,
      timestamp: new Date(),
      metadata: {
        mode,
        persona,
        conversationId: conversationIdRef.current || undefined,
      },
    };

    console.log("[ElevenLabsAgent] ✅ Processed message:", agentMessage);

    // Add to store
    addMessage(agentMessage);

    // Call callback
    onMessage?.(agentMessage);
  }, [log, mode, persona, addMessage, onMessage]);

  const handleError = useCallback((error: any) => {
    console.error("[ElevenLabsAgent] Error:", error);

    const agentError: AgentError = {
      code: error.code || "UNKNOWN_ERROR",
      message: error.message || "An unknown error occurred",
      details: error,
    };

    setState((prev) => ({ ...prev, error: agentError }));
    onError?.(agentError);
  }, [onError]);

  const handleModeChange = useCallback((modeChange: any) => {
    console.log("[ElevenLabsAgent] RAW Mode change:", JSON.stringify(modeChange, null, 2));
    log("Mode changed:", modeChange);

    // Handle mode changes (speaking/listening)
    const isSpeaking = modeChange?.mode === "speaking";
    const isListening = modeChange?.mode === "listening";

    console.log(`[ElevenLabsAgent] Mode: ${modeChange?.mode}, Speaking: ${isSpeaking}, Listening: ${isListening}`);

    setState((prev) => ({
      ...prev,
      speaking: isSpeaking,
      listening: isListening,
    }));

    setIsSpeaking(isSpeaking);
    setIsListening(isListening);

    if (onSpeakingChange) {
      onSpeakingChange(isSpeaking);
    }
  }, [log, setIsSpeaking, setIsListening, onSpeakingChange]);

  const handleStatusChange = useCallback((status: any) => {
    console.log("[ElevenLabsAgent] RAW Status change:", JSON.stringify(status, null, 2));
    log("Status changed:", status);
    const connected = status === "connected";

    setState((prev) => ({ ...prev, connected }));

    if (!connected) {
      conversationIdRef.current = null;
    }
  }, [log]);

  const handleAudio = useCallback((audio: any) => {
    console.log("[ElevenLabsAgent] 🔊 AUDIO EVENT RECEIVED:", {
      hasAudio: !!audio,
      audioType: typeof audio,
      audioKeys: audio ? Object.keys(audio) : [],
      audioDetails: audio,
    });

    // If we're receiving audio events, the audio stream is working
    if (audio) {
      log("✅ Audio stream is active and receiving data");
    }
  }, [log]);

  const handleVadScore = useCallback((score: any) => {
    console.log("[ElevenLabsAgent] RAW VAD score:", score);
  }, []);

  // ============================================================================
  // ELEVENLABS CONVERSATION HOOK
  // ============================================================================

  // Log the configuration being passed
  console.log("[ElevenLabsAgent] useConversation config:", {
    hasClientTools: !!clientToolHandlers,
    clientToolsCount: Object.keys(clientToolHandlers || {}).length,
    overrides: conversationOverrides,
    serverLocation: defaultConnectionConfig.serverLocation,
    textOnly: defaultConnectionConfig.textOnly,
  });

  const conversation = useConversation({
    // Client tools for agent to invoke
    clientTools: clientToolHandlers,

    // Dynamic overrides based on persona and mode
    overrides: conversationOverrides,

    // Connection settings
    serverLocation: defaultConnectionConfig.serverLocation,
    textOnly: defaultConnectionConfig.textOnly,

    // Event handlers with extra logging
    onConnect: (data) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onConnect fired:", data);
      handleConnect(data);
    },
    onDisconnect: (data) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onDisconnect fired:", data);
      handleDisconnect(data);
    },
    onMessage: (msg) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onMessage fired:", msg);
      handleMessage(msg);
    },
    onError: (err) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onError fired:", err);
      handleError(err);
    },
    onModeChange: (mode) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onModeChange fired:", mode);
      handleModeChange(mode);
    },
    onStatusChange: (status) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onStatusChange fired:", status);
      handleStatusChange(status);
    },
    onAudio: (audio) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onAudio fired:", audio);
      handleAudio(audio);
    },
    onVadScore: (score) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onVadScore fired:", score);
      handleVadScore(score);
    },
    onDebug: (debug) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onDebug fired:", debug);
    },
    onUnhandledClientToolCall: (tool) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onUnhandledClientToolCall fired:", tool);
    },
    onCanSendFeedbackChange: (canSend) => {
      console.log("[ElevenLabsAgent] 🎯 SDK onCanSendFeedbackChange fired:", canSend);
    },
  });

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Request microphone permission
   */
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      log("Requesting microphone permission...");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop tracks immediately (SDK will handle actual streaming)
      stream.getTracks().forEach((track) => track.stop());

      setState((prev) => ({ ...prev, microphonePermissionGranted: true }));
      log("Microphone permission granted");

      return true;
    } catch (error) {
      console.error("[ElevenLabsAgent] Microphone permission denied:", error);

      const agentError: AgentError = {
        code: "MICROPHONE_PERMISSION_DENIED",
        message: errorMessages.microphonePermissionDenied,
        details: error,
      };

      setState((prev) => ({ ...prev, error: agentError }));
      onError?.(agentError);

      return false;
    }
  }, [log, onError]);

  /**
   * Resume AudioContext to fix browser autoplay policy issues
   */
  const resumeAudioContext = useCallback(async () => {
    try {
      // Access the global AudioContext if it exists
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const contexts = [];

        // Try to find and resume any suspended AudioContexts
        // This is a workaround since we don't have direct access to the SDK's AudioContext
        if ((window as any).audioContext) {
          contexts.push((window as any).audioContext);
        }

        // Create a temporary context to ensure audio is enabled
        const tempContext = new AudioContext();
        if (tempContext.state === 'suspended') {
          await tempContext.resume();
          log('AudioContext resumed successfully');
        }

        // Resume any found contexts
        for (const ctx of contexts) {
          if (ctx.state === 'suspended') {
            await ctx.resume();
            log('Found and resumed suspended AudioContext');
          }
        }

        // Close temp context
        await tempContext.close();
      }
    } catch (error) {
      console.warn('[ElevenLabsAgent] Failed to resume AudioContext:', error);
      // Non-fatal error, continue anyway
    }
  }, [log]);

  /**
   * Connect to ElevenLabs agent
   */
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      setIsConnecting(true);
      log(`Connecting to agent: ${agentConfig.name} (${agentConfig.agentId})`);

      // Validate agent ID
      if (!agentConfig.agentId) {
        throw new Error(
          `Agent ID not configured for persona "${persona}". ` +
          `Set NEXT_PUBLIC_ELEVENLABS_AGENT_${persona.toUpperCase()} in .env.local`
        );
      }

      // Request microphone permission
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) {
        return false;
      }

      // Resume AudioContext to fix browser autoplay policy
      await resumeAudioContext();

      // Fetch conversation token from API
      log("Fetching conversation token...");
      const response = await fetch(
        `/api/voice/elevenlabs-token?agentId=${agentConfig.agentId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate conversation token"
        );
      }

      const { token } = await response.json();
      log("Token received, starting session...");

      // Start conversation session
      const conversationId = await conversation.startSession({
        conversationToken: token,
        connectionType: defaultConnectionConfig.type,
      });

      conversationIdRef.current = conversationId;

      // Explicitly set connected state to ensure it's synced with isConnecting
      // This fixes the race condition with event handler state updates
      setState((prev) => ({
        ...prev,
        connected: true,
        conversationId,
        error: null,
      }));

      log(`Session started: ${conversationId}`);

      // Wait for the connection to fully establish before setting volume
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set initial volume to ensure audio is audible - with retry logic
      let volumeSet = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!volumeSet && attempts < maxAttempts) {
        attempts++;
        try {
          conversation.setVolume({ volume: 1.0 });
          log(`✅ Volume set to 100% (attempt ${attempts})`);

          // Wait a bit and verify
          await new Promise(resolve => setTimeout(resolve, 300));
          const checkVolume = conversation.getOutputVolume?.() || 0;

          if (checkVolume > 0) {
            volumeSet = true;
            console.log(`[ElevenLabsAgent] ✅ Volume confirmed at ${checkVolume}`);
          } else {
            console.warn(`[ElevenLabsAgent] ⚠️ Volume still 0 after attempt ${attempts}`);
          }
        } catch (error) {
          console.warn(`[ElevenLabsAgent] ⚠️ Failed to set volume (attempt ${attempts}):`, error);
        }
      }

      // Log final output volume for debugging
      const finalVolume = conversation.getOutputVolume?.() || 0;
      console.log(`[ElevenLabsAgent] 🔊 Final output volume: ${finalVolume}`);

      // If volume is still 0, check AudioContext and provide detailed warnings
      if (finalVolume === 0) {
        console.warn(`[ElevenLabsAgent] ⚠️ ⚠️ ⚠️ WARNING: Output volume is 0! ⚠️ ⚠️ ⚠️`);
        console.warn(`[ElevenLabsAgent] This means you likely WON'T HEAR any audio.`);
        console.warn(`[ElevenLabsAgent] Common causes:`);
        console.warn(`  1. 🔴 MOST COMMON: Agent config not saved in ElevenLabs dashboard`);
        console.warn(`  2. Browser audio blocked by autoplay policy`);
        console.warn(`  3. No audio output device available`);
        console.warn(`  4. System volume is muted`);
        
        // Check AudioContext state
        if (typeof window !== 'undefined') {
          try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
              const audioCtx = new AudioContext();
              console.log(`[ElevenLabsAgent] 🔊 AudioContext state:`, audioCtx.state);
              
              if (audioCtx.state === 'suspended') {
                console.warn(`[ElevenLabsAgent] ⚠️ AudioContext is SUSPENDED!`);
                console.warn(`[ElevenLabsAgent] Attempting to resume...`);
                
                audioCtx.resume()
                  .then(() => {
                    console.log(`[ElevenLabsAgent] ✅ AudioContext resumed`);
                    // Retry volume after a delay
                    setTimeout(() => {
                      conversation.setVolume?.({ volume: 1.0 });
                      console.log(`[ElevenLabsAgent] 🔁 Retried volume after AudioContext resume`);
                    }, 500);
                  })
                  .catch((err) => {
                    console.error(`[ElevenLabsAgent] ❌ Failed to resume AudioContext:`, err);
                  });
              }
            }
          } catch (err) {
            console.error(`[ElevenLabsAgent] Error checking AudioContext:`, err);
          }
        }
      } else {
        console.log(`[ElevenLabsAgent] ✅ Volume is properly set - audio should work!`);
      }

      // Log connection status
      console.log(`[ElevenLabsAgent] ✅ Connection established successfully`);
      console.log(`[ElevenLabsAgent] 📋 Connection details:`, {
        conversationId,
        agentId: agentConfig.agentId,
        agentName: agentConfig.name,
        connectionType: defaultConnectionConfig.type,
        serverLocation: defaultConnectionConfig.serverLocation,
      });

      // Important note for debugging
      console.log(
        `[ElevenLabsAgent] ℹ️ TROUBLESHOOTING CHECKLIST:\n` +
        `1. 🔴 CRITICAL: Click SAVE in ElevenLabs dashboard if you see "unsaved changes"\n` +
        `2. ✅ Verify 'audio' event is ENABLED in Advanced > Client events\n` +
        `3. ✅ Ensure agent has a VOICE assigned in ElevenLabs dashboard\n` +
        `4. 🔊 Check browser and system volume levels\n` +
        `5. 🎤 Try speaking or sending a text message to trigger audio\n` +
        `6. 🔄 If still no audio, disconnect and reconnect`
      );

      // Send DSR context to the agent
      if (currentDSR) {
        try {
          let context: string;
          
          // Format context based on mode
          if (mode === "checkin") {
            context = formatCheckInContext(currentDSR);
          } else if (mode === "coaching") {
            context = formatCoachingContext(currentDSR);
          } else {
            context = formatDSRContext(currentDSR);
          }

          // Send as contextual update (won't trigger response)
          conversation.sendContextualUpdate?.(context);
          console.log(`[ElevenLabsAgent] 📊 Sent DSR context for ${currentDSR.dsr_name} (${mode} mode)`);
        } catch (error) {
          console.warn("[ElevenLabsAgent] Failed to send DSR context:", error);
          // Don't fail the connection if context sending fails
        }
      }

      return true;
    } catch (error) {
      console.error("[ElevenLabsAgent] Connection failed:", error);

      const agentError: AgentError = {
        code: "CONNECTION_FAILED",
        message: errorMessages.connectionFailed,
        details: error,
      };

      setState((prev) => ({ ...prev, error: agentError, connected: false }));
      onError?.(agentError);

      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [
    agentConfig,
    persona,
    conversation,
    requestMicrophonePermission,
    resumeAudioContext,
    log,
    onError,
  ]);

  /**
   * Disconnect from agent
   */
  const disconnect = useCallback(async () => {
    try {
      log("Disconnecting...");
      await conversation.endSession();
      conversationIdRef.current = null;
    } catch (error) {
      console.error("[ElevenLabsAgent] Disconnect error:", error);
    }
  }, [conversation, log]);

  // ============================================================================
  // MESSAGING
  // ============================================================================

  /**
   * Send a text message to the agent
   */
  const sendMessage = useCallback(
    (text: string) => {
      if (!state.connected) {
        console.warn("[ElevenLabsAgent] Cannot send message: not connected");
        return;
      }

      log("Sending message:", text);

      // Add user message to store
      const userMessage: AgentMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        role: "user",
        content: text,
        timestamp: new Date(),
        metadata: {
          mode,
          persona,
          conversationId: conversationIdRef.current || undefined,
        },
      };

      addMessage(userMessage);

      // Send to agent
      conversation.sendUserMessage(text);
    },
    [state.connected, mode, persona, addMessage, conversation, log]
  );

  /**
   * Send contextual update (doesn't trigger agent response)
   */
  const sendContextualUpdate = useCallback(
    (context: string) => {
      if (!state.connected) {
        return;
      }

      log("Sending contextual update:", context);
      conversation.sendContextualUpdate(context);
    },
    [state.connected, conversation, log]
  );

  /**
   * Notify agent of user activity (prevents interruptions)
   */
  const notifyUserActivity = useCallback(() => {
    if (!state.connected) {
      return;
    }

    conversation.sendUserActivity();
  }, [state.connected, conversation]);

  // ============================================================================
  // AUDIO CONTROLS
  // ============================================================================

  /**
   * Set output volume (0-1)
   */
  const setVolume = useCallback(
    async (volume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      await conversation.setVolume({ volume: clampedVolume });
      log(`Volume set to ${clampedVolume}`);
    },
    [conversation, log]
  );

  /**
   * Get current input/output volumes
   */
  const getVolumes = useCallback(() => {
    return {
      input: conversation.getInputVolume?.() || 0,
      output: conversation.getOutputVolume?.() || 0,
    };
  }, [conversation]);

  // ============================================================================
  // FEEDBACK
  // ============================================================================

  /**
   * Send feedback for the conversation
   */
  const sendFeedback = useCallback(
    (positive: boolean) => {
      if (!state.connected) {
        return;
      }

      log(`Sending feedback: ${positive ? "positive" : "negative"}`);
      conversation.sendFeedback(positive);
    },
    [state.connected, conversation, log]
  );

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationIdRef.current) {
        conversation.endSession();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // RETURN API
  // ============================================================================

  const returnValue = {
    // State
    ...state,
    isConnecting,

    // Connection
    connect,
    disconnect,
    requestMicrophonePermission,

    // Messaging
    sendMessage,
    sendContextualUpdate,
    notifyUserActivity,

    // Audio
    setVolume,
    getVolumes,

    // Feedback
    sendFeedback,
    canSendFeedback: conversation.canSendFeedback,

    // Agent info
    agentConfig,

    // Raw conversation object (for advanced use)
    conversation,
  };

  // Log state for debugging
  console.log("[ElevenLabsAgent] Returning state:", {
    connected: returnValue.connected,
    speaking: returnValue.speaking,
    listening: returnValue.listening,
    isConnecting: returnValue.isConnecting,
  });

  return returnValue;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type { UseElevenLabsAgentOptions, AgentMessage, AgentError, AgentState };
