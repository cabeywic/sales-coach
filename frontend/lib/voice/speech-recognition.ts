export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = "en-US";
      }
    }
  }

  startListening(
    onResult: (transcript: string) => void,
    onError?: (error: any) => void
  ): void {
    if (!this.recognition) {
      console.warn("Speech recognition not supported");
      return;
    }

    if (this.isListening) {
      return;
    }

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      this.isListening = false;
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (onError) onError(event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      this.isListening = false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isActive(): boolean {
    return this.isListening;
  }

  setLanguage(lang: "en-US" | "si-LK" | "ta-LK"): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }
}

export const speechRecognizer = new SpeechRecognizer();
