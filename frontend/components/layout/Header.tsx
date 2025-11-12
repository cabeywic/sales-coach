"use client";

import { useStore } from "@/store/useStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Mic, MicOff, Target } from "lucide-react";
import Link from "next/link";

export function Header() {
  const { currentDSR, voiceEnabled, setVoiceEnabled } = useStore();

  const initials = currentDSR?.dsr_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "DS";

  const targetAchievement = currentDSR?.target_achievement
    ? parseInt(currentDSR.target_achievement)
    : 0;

  const getPerformanceBadge = () => {
    if (targetAchievement >= 120) return { label: "Excellent", variant: "default" as const };
    if (targetAchievement >= 100) return { label: "On Track", variant: "secondary" as const };
    if (targetAchievement >= 80) return { label: "Below Target", variant: "outline" as const };
    return { label: "Needs Focus", variant: "destructive" as const };
  };

  const badge = getPerformanceBadge();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section - Logo and Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            CCS
          </div>
          <div className="hidden md:flex flex-col">
            <h1 className="text-base font-semibold leading-none">Sales Coach</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Ceylon Cold Stores
            </p>
          </div>
        </div>

        {/* Center Section - User Info (Desktop) */}
        <div className="hidden lg:flex items-center gap-3 flex-1 justify-center max-w-md">
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium">{currentDSR?.dsr_name || "Sales Representative"}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={badge.variant} className="text-xs">
                {badge.label}
              </Badge>
              {currentDSR && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>{currentDSR.target_achievement}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant={voiceEnabled ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            title={voiceEnabled ? "Disable Voice" : "Enable Voice"}
          >
            {voiceEnabled ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </Button>

          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>

          <div className="hidden md:flex items-center gap-3 ml-2 pl-2 border-l">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
