// SpeechService.ts - Web Speech API Service with full Hindi/English and Male/Female supports

export interface VoiceSettings {
  voiceType: "male" | "female";
  language: "en" | "hi";
  rate: number;      // 0.5 - 2.0
  volume: number;    // 0.0 - 1.0
  feedbackEnabled: boolean;
}

export const DEFAULT_SETTINGS: VoiceSettings = {
  voiceType: "female",
  language: "en",
  rate: 1.0,
  volume: 1.0,
  feedbackEnabled: true,
};

class SpeechServiceClass {
  private settings: VoiceSettings = DEFAULT_SETTINGS;
  private recognitionInstance: any = null;

  constructor() {
    this.loadSettings();
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<VoiceSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem("sahara_voice_settings", JSON.stringify(this.settings));
  }

  private loadSettings() {
    try {
      const cached = localStorage.getItem("sahara_voice_settings");
      if (cached) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn("Failed to load voice settings:", e);
    }
  }

  /**
   * Text-to-Speech Synthesis
   */
  public speak(text: string, overrideLanguage?: "en" | "hi", onStart?: () => void, onEnd?: () => void) {
    if (!this.settings.feedbackEnabled) {
      console.log("Voice feedback is disabled in settings. Skipping text-to-speech.");
      if (onEnd) onEnd();
      return;
    }

    try {
      // Cancel any ongoing speech first
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      } else {
        console.warn("Speech Synthesis is not supported in this browser.");
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const lang = overrideLanguage || this.settings.language;

      utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
      utterance.rate = this.settings.rate;
      utterance.volume = this.settings.volume;

      // Select voice based on gender and language
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = this.findVoice(voices, lang, this.settings.voiceType);
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      if (onStart) {
        utterance.onstart = onStart;
      }
      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Text-to-speech failed:", e);
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  private findVoice(voices: SpeechSynthesisVoice[], lang: "en" | "hi", type: "male" | "female"): SpeechSynthesisVoice | null {
    const locale = lang === "hi" ? "hi" : "en";
    
    // Filter by language locale
    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(locale));
    if (langVoices.length === 0) return null;

    // Try to find voice by gender clues in name (some browsers have specific names)
    // Male names or keywords: 'david', 'microsoft david', 'google male', 'male', 'mark', 'ravi'
    // Female names: 'zira', 'female', 'google female', 'heera', 'hazel', 'susan', 'en-US-Wavenet-F', 'hi-IN-Wavenet-F'
    const maleClues = ["male", "david", "mark", "ravi", "george", "microsoft david", "google male"];
    const femaleClues = ["female", "zira", "heera", "hazel", "susan", "en-us-wavenet-f", "google female"];

    const matchClues = type === "male" ? maleClues : femaleClues;
    
    // Attempt match with clues
    for (const voice of langVoices) {
      const nameLower = voice.name.toLowerCase();
      if (matchClues.some(clue => nameLower.includes(clue))) {
        return voice;
      }
    }

    // Secondary attempt: if we wanted male but couldn't find one, or female but couldn't find, match opposite clues
    const oppositeClues = type === "male" ? femaleClues : maleClues;
    const remainingVoices = langVoices.filter(v => !oppositeClues.some(clue => v.name.toLowerCase().includes(clue)));
    if (remainingVoices.length > 0) {
      return remainingVoices[0];
    }

    return langVoices[0];
  }

  /**
   * Speech-to-Text Recognition
   */
  public startListening(
    onResult: (text: string) => void,
    onError: (errorMsg: string) => void,
    onEnd: () => void,
    onVolumeChange?: (volume: number) => void
  ) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError("Your browser does not support Speech Recognition. Please use Google Chrome or Microsoft Edge.");
      onEnd();
      return null;
    }

    // Stop existing instance if running
    this.stopListening();

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = this.settings.language === "hi" ? "hi-IN" : "en-US";

      let hasEndedGracefully = false;

      rec.onstart = () => {
        console.log("Speech recognition started");
        // Simulate volume meter changes for visual indicator
        if (onVolumeChange) {
          const interval = setInterval(() => {
            if (hasEndedGracefully) {
              clearInterval(interval);
              return;
            }
            onVolumeChange(Math.floor(Math.random() * 80) + 10);
          }, 150);
        }
      };

      rec.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          console.log("Recognized speech:", transcript);
          onResult(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        hasEndedGracefully = true;
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          onError("Microphone access denied. Please verify in site preferences that microphone permission is granted to Sahara.");
        } else if (event.error === "no-speech") {
          onError("No speech was detected. Please try speaking again clearly.");
        } else if (event.error === "network") {
          onError("Network connection failure. Speech recognition requires active connectivity.");
        } else {
          onError(`Speech recognition error: ${event.error}`);
        }
      };

      rec.onend = () => {
        console.log("Speech recognition ended");
        hasEndedGracefully = true;
        onEnd();
      };

      rec.start();
      this.recognitionInstance = rec;
      return rec;
    } catch (e: any) {
      console.error("Speech recognition initiation failed:", e);
      onError(e.message || "Could not start microphone capture.");
      onEnd();
      return null;
    }
  }

  public stopListening() {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.abort();
      } catch (e) {}
      this.recognitionInstance = null;
    }
  }
}

export const SpeechService = new SpeechServiceClass();
