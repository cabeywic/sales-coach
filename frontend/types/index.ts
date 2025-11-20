// Core DSR Data Structure (legacy single record)
export interface DSRData {
  // Identity
  date: string;
  year_month: string;
  dsr_id: string;
  dsr_name: string;

  // Territory
  distributor: string;
  route_id: string;
  region: string;
  surrounding_nature: string;

  // Performance Metrics
  target_achievement: string;
  target_achievement_tag: string;
  sales_growth_trend: string;
  sales_growth_tag: string;
  overall_good_bad_performing_dsr_tag: string;

  // Volume & SKU
  volume_per_outlet: string;
  avg_monthly_sales_for_month_of_dsr: string;
  sku_to_cover: number;
  sku_focus_progress: string;

  // Seasonal
  current_festive_season: string;
  festival_season_SKUs_to_outlet: number;
  promo_running_for: number;

  // Outlets
  outlets_to_sell_to: number;
  eateries_to_sell_to: number;
  noneateries_to_sell_to: number;
  smmt_to_sell_to: number;
  outlets_visited: number;
  outlets_missed_last_week: number;
  missed_outlets_last_month: number;

  // Efficiency
  route_efficiency_score: number;

  // Classification
  dsr_type: string;
  competitor_presence: string;

  // Development
  strength_areas: string;
  development_areas: string;

  // Engagement
  preferred_checkin_time: string;
  response_rate_to_coach: string;
  day_of_week_performance: string;
  conversation_summary_last_week: string;
}

// Extended DSR Info with outlet reference (from dsr-info.json)
export interface DSRInfo extends DSRData {
  outlet_id: string;
}

// DSR Summary for selection
export interface DSRSummary {
  dsr_id: string;
  dsr_name: string;
  latest_record: DSRInfo;
  total_records: number;
}

export interface Outlet {
  outlet_id: string;
  name: string;
  type: "Eatery" | "Non-Eatery" | "SMMT";
  last_visit_date: string;
  last_order_value: number;
  avg_order_value: number;
  preferred_visit_time: "morning" | "afternoon" | "evening";
  owner_name: string;
  relationship_score: number;
  notes: string[];
  lat?: number;
  lng?: number;
  priority_score?: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "agent";
  content: string;
  timestamp: Date;
  metadata?: {
    mode?: "checkin" | "coaching";
    persona?: PersonaType;
    voice?: boolean;
  };
}

export interface ConversationHistory {
  conversation_id: string;
  date: string;
  mode: "checkin" | "coaching";
  messages: Message[];
  summary: string;
  action_items: string[];
  sentiment: "positive" | "neutral" | "negative" | "receptive";
}

export type PersonaType = "professional" | "friendly" | "motivator" | "advisor";

export interface Persona {
  name: string;
  tone: string;
  greeting: string;
  style: {
    formality: "low" | "medium" | "high" | "very high";
    dataEmphasis: "low" | "medium" | "high";
    motivation: "medium" | "high" | "very high";
    empathy: "medium" | "high";
  };
  voiceConfig?: {
    rate: number;
    pitch: number;
    volume: number;
  };
}

export interface PersonalizationSettings {
  preferred_persona: PersonaType;
  language: "english" | "tamil";
  notification_preferences: {
    morning_briefing: boolean;
    real_time_nudges: boolean;
    end_of_day_summary: boolean;
  };
  voice_enabled: boolean;
}

export interface PerformanceInsight {
  status: "excellent" | "good" | "needs-attention" | "critical";
  recommendations: string[];
  targetAchievement: number;
  growthTrend: number;
}

export interface Nudge {
  type: "proximity_alert" | "seasonal_opportunity" | "efficiency_tip" | "missed_outlet";
  priority: "low" | "medium" | "high";
  message: string;
  action?: string;
  outlet?: Outlet;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

export interface DashboardMetrics {
  targetAchievement: number;
  salesGrowth: number;
  outletsVisited: number;
  outletsMissed: number;
  routeEfficiency: number;
  skuProgress: number;
}

export interface AppState {
  // User - Multi-DSR Support
  allDSRs: DSRInfo[];
  selectedDSRId: string | null;
  currentDSR: DSRData | null; // Current selected DSR's latest record
  dsrHistory: DSRInfo[]; // All records for selected DSR
  settings: PersonalizationSettings;

  // UI State
  activeMode: "home" | "checkin" | "coaching" | "settings";
  selectedPersona: PersonaType;

  // Data
  outlets: Outlet[];
  conversations: ConversationHistory[];
  currentConversation: Message[];
  checkinConversation: Message[];
  coachingConversation: Message[];

  // Voice
  voiceEnabled: boolean;
  isSpeaking: boolean;
  isListening: boolean;

  // Actions
  setCurrentDSR: (dsr: DSRData) => void;
  setSelectedDSRId: (dsrId: string) => void;
  getDSRRecords: (dsrId: string) => DSRInfo[];
  getLatestDSRRecord: (dsrId: string) => DSRInfo | null;
  getAllDSRSummaries: () => DSRSummary[];
  setActiveMode: (mode: AppState["activeMode"]) => void;
  setSelectedPersona: (persona: PersonaType) => void;
  updateSettings: (settings: Partial<PersonalizationSettings>) => void;
  addMessage: (message: Message) => void;
  clearConversation: () => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsListening: (listening: boolean) => void;
}
