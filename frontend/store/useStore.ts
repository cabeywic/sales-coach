import { create } from "zustand";
import { AppState, DSRData, DSRInfo, DSRSummary, Message, PersonaType, PersonalizationSettings } from "@/types";
import dsrInfoJson from "@/lib/data/dsr-info.json";
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

// Load all DSRs from dsr-info.json
const allDSRsData = dsrInfoJson as DSRInfo[];

// Get the first DSR's latest record as default
const getInitialDSR = (): { dsrId: string; currentDSR: DSRData; history: DSRInfo[] } => {
  if (allDSRsData.length === 0) {
    return { dsrId: "", currentDSR: null as any, history: [] };
  }

  // Get first DSR ID
  const firstDSRId = allDSRsData[0].dsr_id;

  // Get all records for this DSR, sorted by date (latest first)
  const dsrRecords = allDSRsData
    .filter((record) => record.dsr_id === firstDSRId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    dsrId: firstDSRId,
    currentDSR: dsrRecords[0],
    history: dsrRecords,
  };
};

const initialDSR = getInitialDSR();

export const useStore = create<AppState>((set, get) => ({
  // User - Multi-DSR Support
  allDSRs: allDSRsData,
  selectedDSRId: initialDSR.dsrId,
  currentDSR: initialDSR.currentDSR,
  dsrHistory: initialDSR.history,
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

  setSelectedDSRId: (dsrId) => {
    const allDSRs = get().allDSRs;
    const dsrRecords = allDSRs
      .filter((record) => record.dsr_id === dsrId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (dsrRecords.length > 0) {
      set({
        selectedDSRId: dsrId,
        currentDSR: dsrRecords[0],
        dsrHistory: dsrRecords,
      });
    }
  },

  getDSRRecords: (dsrId) => {
    const allDSRs = get().allDSRs;
    return allDSRs
      .filter((record) => record.dsr_id === dsrId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getLatestDSRRecord: (dsrId) => {
    const records = get().getDSRRecords(dsrId);
    return records.length > 0 ? records[0] : null;
  },

  getAllDSRSummaries: () => {
    const allDSRs = get().allDSRs;
    const dsrMap = new Map<string, DSRInfo[]>();

    // Group by DSR ID
    allDSRs.forEach((record) => {
      if (!dsrMap.has(record.dsr_id)) {
        dsrMap.set(record.dsr_id, []);
      }
      dsrMap.get(record.dsr_id)!.push(record);
    });

    // Create summaries
    const summaries: DSRSummary[] = [];
    dsrMap.forEach((records, dsrId) => {
      const sortedRecords = records.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      summaries.push({
        dsr_id: dsrId,
        dsr_name: sortedRecords[0].dsr_name,
        latest_record: sortedRecords[0],
        total_records: records.length,
      });
    });

    return summaries.sort((a, b) => a.dsr_name.localeCompare(b.dsr_name));
  },

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
