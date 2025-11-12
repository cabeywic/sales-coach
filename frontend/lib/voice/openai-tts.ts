import { PersonaType } from "@/types";

export class OpenAITTS {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeakingState = false;

  async speak(text: string, persona: PersonaType, onEnd?: () => void): Promise<void> {
    try {
      // Cancel any ongoing speech
      this.cancel();

      this.isSpeakingState = true;

      // Call our TTS API endpoint
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          persona,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio element
      this.currentAudio = new Audio(audioUrl);

      this.currentAudio.onended = () => {
        this.isSpeakingState = false;
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      this.currentAudio.onerror = (error) => {
        console.error("Audio playback error:", error);
        this.isSpeakingState = false;
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      await this.currentAudio.play();
    } catch (error) {
      console.error("TTS error:", error);
      this.isSpeakingState = false;
      if (onEnd) onEnd();
    }
  }

  cancel(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.isSpeakingState = false;
    }
  }

  pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
    }
  }

  isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  isPaused(): boolean {
    return this.currentAudio ? this.currentAudio.paused : false;
  }
}

export const openAITTS = new OpenAITTS();
