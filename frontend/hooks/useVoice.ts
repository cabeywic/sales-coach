import { useCallback, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { openAITTS } from "@/lib/voice/openai-tts";
import { speechRecognizer } from "@/lib/voice/speech-recognition";

export function useVoice() {
  const {
    voiceEnabled,
    isSpeaking,
    isListening,
    selectedPersona,
    setIsSpeaking,
    setIsListening,
  } = useStore();

  const speak = useCallback(
    async (text: string) => {
      if (!voiceEnabled) return;

      setIsSpeaking(true);
      await openAITTS.speak(text, selectedPersona, () => {
        setIsSpeaking(false);
      });
    },
    [voiceEnabled, selectedPersona, setIsSpeaking]
  );

  const stopSpeaking = useCallback(() => {
    openAITTS.cancel();
    setIsSpeaking(false);
  }, [setIsSpeaking]);

  const startListening = useCallback(
    (onTranscript: (text: string) => void) => {
      if (!voiceEnabled) return;

      setIsListening(true);
      speechRecognizer.startListening(
        (transcript) => {
          setIsListening(false);
          onTranscript(transcript);
        },
        (error) => {
          console.error("Speech recognition error:", error);
          setIsListening(false);
        }
      );
    },
    [voiceEnabled, setIsListening]
  );

  const stopListening = useCallback(() => {
    speechRecognizer.stopListening();
    setIsListening(false);
  }, [setIsListening]);

  useEffect(() => {
    return () => {
      openAITTS.cancel();
      speechRecognizer.stopListening();
    };
  }, []);

  return {
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    isSpeaking,
    isListening,
    voiceEnabled,
  };
}
