import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { OpenAIRealtimeClient } from "@/lib/voice/openai-realtime-client";

export function useOpenAIVoice(mode: "checkin" | "coaching") {
  const {
    voiceEnabled,
    currentDSR,
    selectedPersona,
    addMessage,
    setIsSpeaking,
    setIsListening,
    isSpeaking,
    isListening,
  } = useStore();

  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<OpenAIRealtimeClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize client
  useEffect(() => {
    if (voiceEnabled && !clientRef.current) {
      clientRef.current = new OpenAIRealtimeClient({
        onMessage: (text) => {
          // Add assistant message to conversation
          addMessage({
            id: Date.now().toString(),
            role: "assistant",
            content: text,
            timestamp: new Date(),
            metadata: { mode, persona: selectedPersona, voice: true },
          });
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error("Voice error:", error);
          setIsConnected(false);
          setIsSpeaking(false);
          setIsListening(false);
        },
        onConnected: () => {
          setIsConnected(true);
        },
        onDisconnected: () => {
          setIsConnected(false);
          setIsSpeaking(false);
          setIsListening(false);
        },
      });
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [voiceEnabled]);

  // Connect when voice is enabled
  const connect = useCallback(async () => {
    if (clientRef.current && !isConnected && voiceEnabled && currentDSR) {
      await clientRef.current.connect(currentDSR, selectedPersona, mode);
    }
  }, [isConnected, voiceEnabled, currentDSR, selectedPersona, mode]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  // Start listening (record audio)
  const startListening = useCallback(async () => {
    if (!isConnected || !clientRef.current) {
      await connect();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context for processing
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && clientRef.current) {
          const arrayBuffer = await event.data.arrayBuffer();
          clientRef.current.sendAudio(arrayBuffer);
        }
      };

      mediaRecorder.onstop = () => {
        if (clientRef.current) {
          clientRef.current.commitAudio();
        }
        stream.getTracks().forEach((track) => track.stop());
        setIsListening(false);
      };

      mediaRecorder.start(100); // Send chunks every 100ms
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsListening(false);
    }
  }, [isConnected, connect, setIsListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, [setIsListening]);

  // Send text message
  const sendTextMessage = useCallback(
    (text: string) => {
      if (!isConnected) {
        console.warn("Not connected to voice server");
        return;
      }

      if (clientRef.current) {
        // Add user message to conversation
        addMessage({
          id: Date.now().toString(),
          role: "user",
          content: text,
          timestamp: new Date(),
          metadata: { mode, persona: selectedPersona, voice: true },
        });

        // Send to OpenAI
        clientRef.current.sendText(text);
        setIsSpeaking(true);
      }
    },
    [isConnected, mode, selectedPersona, addMessage, setIsSpeaking]
  );

  return {
    isConnected,
    isListening,
    isSpeaking,
    voiceEnabled,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendTextMessage,
  };
}
