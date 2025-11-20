"use client";

import { Button } from "@/components/ui/button";
import { Clock, Target, MapPin, TrendingUp, Lightbulb, Calendar } from "lucide-react";

interface QuickActionsProps {
  mode: "checkin" | "coaching";
  onActionClick: (action: string) => void;
  language?: "english" | "tamil";
}

export function QuickActions({ mode, onActionClick, language = "english" }: QuickActionsProps) {
  // English quick actions
  const checkinActionsEnglish = [
    { icon: Clock, label: "Morning Briefing", query: "Give me my morning briefing" },
    { icon: Target, label: "Today's Goals", query: "What are my priority outlets today?" },
    { icon: MapPin, label: "Route Plan", query: "Help me plan my route for today" },
    { icon: Calendar, label: "Festive SKUs", query: "Show me festive season opportunities" },
  ];

  const coachingActionsEnglish = [
    { icon: TrendingUp, label: "Performance", query: "How am I performing this month?" },
    { icon: Lightbulb, label: "Improve", query: "What can I do to improve my results?" },
    { icon: Target, label: "Goal Setting", query: "Help me set goals for this week" },
    { icon: MapPin, label: "Route Tips", query: "How can I improve my route efficiency?" },
  ];

  // Tamil quick actions
  const checkinActionsTamil = [
    { icon: Clock, label: "காலை சுருக்கம்", query: "எனக்கு இன்றைய காலை சுருக்கத்தை கொடுங்கள்" },
    { icon: Target, label: "இன்றைய இலக்குகள்", query: "இன்று என் முன்னுரிமை கடைகள் எவை?" },
    { icon: MapPin, label: "வழித்திட்டம்", query: "இன்றைய வழியை திட்டமிட உதவுங்கள்" },
    { icon: Calendar, label: "பண்டிகை தயாரிப்புகள்", query: "பண்டிகை காலத்திற்கான வாய்ப்புகளைக் காட்டுங்கள்" },
  ];

  const coachingActionsTamil = [
    { icon: TrendingUp, label: "செயல்திறன்", query: "இந்த மாதம் நான் எப்படி செயல்படுகிறேன்?" },
    { icon: Lightbulb, label: "மேம்பாடு", query: "என் முடிவுகளை மேம்படுத்த என்ன செய்யலாம்?" },
    { icon: Target, label: "இலக்கு அமைத்தல்", query: "இந்த வாரத்திற்கான இலக்குகளை அமைக்க உதவுங்கள்" },
    { icon: MapPin, label: "வழி குறிப்புகள்", query: "என் வழித்திறனை எப்படி மேம்படுத்துவது?" },
  ];

  // Select actions based on language
  const actions = language === "tamil"
    ? (mode === "checkin" ? checkinActionsTamil : coachingActionsTamil)
    : (mode === "checkin" ? checkinActionsEnglish : coachingActionsEnglish);

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onActionClick(action.query)}
          >
            <Icon className="h-3 w-3 mr-1" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
