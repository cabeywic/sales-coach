"use client";

import { Button } from "@/components/ui/button";
import { Clock, Target, MapPin, TrendingUp, Lightbulb, Calendar } from "lucide-react";

interface QuickActionsProps {
  mode: "checkin" | "coaching";
  onActionClick: (action: string) => void;
}

export function QuickActions({ mode, onActionClick }: QuickActionsProps) {
  const checkinActions = [
    { icon: Clock, label: "Morning Briefing", query: "Give me my morning briefing" },
    { icon: Target, label: "Today's Goals", query: "What are my priority outlets today?" },
    { icon: MapPin, label: "Route Plan", query: "Help me plan my route for today" },
    { icon: Calendar, label: "Festive SKUs", query: "Show me festive season opportunities" },
  ];

  const coachingActions = [
    { icon: TrendingUp, label: "Performance", query: "How am I performing this month?" },
    { icon: Lightbulb, label: "Improve", query: "What can I do to improve my results?" },
    { icon: Target, label: "Goal Setting", query: "Help me set goals for this week" },
    { icon: MapPin, label: "Route Tips", query: "How can I improve my route efficiency?" },
  ];

  const actions = mode === "checkin" ? checkinActions : coachingActions;

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
