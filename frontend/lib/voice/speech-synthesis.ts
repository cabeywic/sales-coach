import { PersonaType } from "@/types";
import { personas } from "../agents/persona-config";

export class SpeechSynthesizer {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  speak(text: string, persona: PersonaType, onEnd?: () => void): void {
    if (!this.synth) {
      console.warn("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const personaConfig = personas[persona].voiceConfig;

    if (personaConfig) {
      utterance.rate = personaConfig.rate;
      utterance.pitch = personaConfig.pitch;
      utterance.volume = personaConfig.volume;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  cancel(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  isPaused(): boolean {
    return this.synth ? this.synth.paused : false;
  }
}

export const speechSynthesizer = new SpeechSynthesizer();
