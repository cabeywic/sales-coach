import { create } from "zustand";
import { AppState, DSRData, Message, PersonaType, PersonalizationSettings } from "@/types";
import dsrDataJson from "@/lib/data/dsr-data.json";
import outletsJson from "@/lib/data/outlets.json";

const initialSettings: PersonalizationSettings = {
  preferred_persona: "friendly",
  language: "english",
  notification_preferences: {
    morning_briefing: true,
    real_time_nudges: true,
    end_of_day_summary: true,
  },
  voice_enabled: false,
};

export const useStore = create<AppState>((set) => ({
  // User
  currentDSR: dsrDataJson as DSRData,
  settings: initialSettings,

  // UI State
  activeMode: "home",
  selectedPersona: "friendly",

  // Data
  outlets: outletsJson,
  conversations: [],
  currentConversation: [],
  checkinConversation: [],
  coachingConversation: [],

  // Voice
  voiceEnabled: false,
  isSpeaking: false,
  isListening: false,

  // Actions
  setCurrentDSR: (dsr) => set({ currentDSR: dsr }),

  setActiveMode: (mode) => set({ activeMode: mode }),

  setSelectedPersona: (persona) =>
    set((state) => ({
      selectedPersona: persona,
      settings: {
        ...state.settings,
        preferred_persona: persona,
      },
    })),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...newSettings,
      },
    })),

  addMessage: (message) => {
    const mode = message.metadata?.mode;
    if (mode === "checkin") {
      set((state) => ({
        checkinConversation: [...state.checkinConversation, message],
        currentConversation: [...state.checkinConversation, message],
      }));
    } else if (mode === "coaching") {
      set((state) => ({
        coachingConversation: [...state.coachingConversation, message],
        currentConversation: [...state.coachingConversation, message],
      }));
    } else {
      // Fallback to generic conversation
      set((state) => ({
        currentConversation: [...state.currentConversation, message],
      }));
    }
  },

  clearConversation: () => set({ currentConversation: [] }),

  setVoiceEnabled: (enabled) =>
    set((state) => ({
      voiceEnabled: enabled,
      settings: {
        ...state.settings,
        voice_enabled: enabled,
      },
    })),

  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),

  setIsListening: (listening) => set({ isListening: listening }),
}));
